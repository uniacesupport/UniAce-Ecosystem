import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { Curriculum, UserProfile, CourseId } from '../types';
import { LogService } from './logService';

export interface IntegrityIssue {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  department?: string;
  level?: string;
  type: 'MISSING_COURSE' | 'EXTRA_COURSE' | 'LEVEL_MISMATCH' | 'DEPT_MISMATCH' | 'EMPTY_CURRICULUM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  expectedCourseIds?: string[];
  actualCourseIds?: string[];
  metadata?: any;
  resolved?: boolean;
  timestamp?: any;
}

export class CurriculumIntegrityService {
  private static readonly LOG_COLLECTION = 'integrity_issues';

  /**
   * Fetches the canonical curriculum for a specific cohort
   */
  static async getCanonicalCurriculum(dept: string, level: string, sem: string): Promise<Curriculum | null> {
    // Normalize ID format: DEPT_LEVEL_SEM (e.g. MSE_100_2)
    // We use a helper to generate a consistent ID
    const curriculumId = this.generateCurriculumId(dept, level, sem);
    const docRef = doc(db, 'curriculums', curriculumId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data() as Curriculum;
    }
    return null;
  }

  /**
   * Generates a consistent ID for curriculum documents
   */
  static generateCurriculumId(dept: string, level: string, sem: string): string {
    const cleanDept = dept.toUpperCase().replace(/\s+/g, '_');
    const cleanLevel = level.replace(/\D/g, '');
    const cleanSem = sem.includes('1') ? '1' : '2';
    return `${cleanDept}_${cleanLevel}_${cleanSem}`;
  }

  /**
   * Validates a user's curriculum against the canonical source
   */
  static async validateUserCurriculum(
    userId: string, 
    profile: UserProfile, 
    actualCourseIds: CourseId[]
  ): Promise<IntegrityIssue[]> {
    if (!profile.department || !profile.academic_level || !profile.semester) {
      return [];
    }

    const canonical = await this.getCanonicalCurriculum(
      profile.department,
      profile.academic_level,
      profile.semester
    );

    const issues: IntegrityIssue[] = [];

    if (!canonical) {
      // If no canonical curriculum exists, we can't validate, but we log it as a system gap
      console.warn(`No canonical curriculum found for ${profile.department} ${profile.academic_level} ${profile.semester}`);
      return [];
    }

    const expectedIds = canonical.courseIds || [];

    // 1. Check for missing courses
    const missing = expectedIds.filter(id => !actualCourseIds.includes(id as CourseId));
    if (missing.length > 0) {
      issues.push({
        userId,
        userEmail: profile.email,
        userName: profile.displayName,
        department: profile.department,
        level: profile.academic_level,
        type: 'MISSING_COURSE',
        severity: missing.length > 2 ? 'HIGH' : 'MEDIUM',
        details: `User is missing ${missing.length} expected courses: ${missing.join(', ')}`,
        expectedCourseIds: expectedIds,
        actualCourseIds: actualCourseIds,
        metadata: { missing }
      });
    }

    // 2. Check for extra courses (potential level/dept leaks)
    const extra = actualCourseIds.filter(id => !expectedIds.includes(id));
    if (extra.length > 0) {
      issues.push({
        userId,
        userEmail: profile.email,
        userName: profile.displayName,
        department: profile.department,
        level: profile.academic_level,
        type: 'EXTRA_COURSE',
        severity: 'LOW',
        details: `User has ${extra.length} extra courses not in canonical curriculum: ${extra.join(', ')}`,
        expectedCourseIds: expectedIds,
        actualCourseIds: actualCourseIds,
        metadata: { extra }
      });
    }

    // 3. Check for empty curriculum
    if (actualCourseIds.length === 0 && expectedIds.length > 0) {
      issues.push({
        userId,
        userEmail: profile.email,
        userName: profile.displayName,
        department: profile.department,
        level: profile.academic_level,
        type: 'EMPTY_CURRICULUM',
        severity: 'CRITICAL',
        details: `User has 0 courses but should have ${expectedIds.length}`,
        expectedCourseIds: expectedIds,
        actualCourseIds: actualCourseIds
      });
    }

    // Log issues to Firestore for Admin Dashboard
    for (const issue of issues) {
      await this.logIntegrityIssue(issue);
    }

    return issues;
  }

  /**
   * Logs an integrity issue to the database
   */
  static async logIntegrityIssue(issue: IntegrityIssue) {
    try {
      // Check if a similar issue was logged recently to avoid spam
      // (Simple implementation: just add for now, we can optimize later)
      await addDoc(collection(db, this.LOG_COLLECTION), {
        ...issue,
        timestamp: serverTimestamp(),
        resolved: false
      });
      
      LogService.log('error', 'system', `Integrity Issue [${issue.type}] for ${issue.userEmail}: ${issue.details}`);
    } catch (error) {
      console.error("Failed to log integrity issue:", error);
    }
  }

  /**
   * Fetches all unresolved integrity issues
   */
  static async getUnresolvedIssues(): Promise<IntegrityIssue[]> {
    try {
      const q = query(collection(db, this.LOG_COLLECTION), where('resolved', '==', false));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as IntegrityIssue));
    } catch (error) {
      console.error("Error fetching unresolved issues:", error);
      // Re-throw with more context if it's a permission error
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        throw new Error(JSON.stringify({
          error: error.message,
          operationType: 'list',
          path: this.LOG_COLLECTION,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified
          }
        }));
      }
      throw error;
    }
  }

  /**
   * Remediates a single integrity issue
   */
  static async remediateIssue(issue: IntegrityIssue): Promise<boolean> {
    if (!issue.id) return false;
    
    try {
      const userDocRef = doc(db, 'users', issue.userId);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        throw new Error(`User ${issue.userId} not found`);
      }

      const userData = userSnap.data();
      let currentCourses = userData.enrolledCourses || [];

      if (issue.type === 'MISSING_COURSE' && issue.metadata?.missing) {
        currentCourses = Array.from(new Set([...currentCourses, ...issue.metadata.missing]));
      } else if (issue.type === 'EXTRA_COURSE' && issue.metadata?.extra) {
        currentCourses = currentCourses.filter((id: string) => !issue.metadata.extra.includes(id));
      } else if (issue.type === 'EMPTY_CURRICULUM' && issue.expectedCourseIds) {
        currentCourses = issue.expectedCourseIds;
      }

      const batch = writeBatch(db);
      batch.update(userDocRef, { enrolledCourses: currentCourses });
      batch.update(doc(db, this.LOG_COLLECTION, issue.id), { 
        resolved: true, 
        resolvedAt: serverTimestamp(),
        resolvedBy: 'admin'
      });

      await batch.commit();
      LogService.log('success', 'admin', `Remediated ${issue.type} for ${issue.userEmail}`);
      return true;
    } catch (error) {
      console.error("Remediation failed:", error);
      return false;
    }
  }

  /**
   * Bulk remediates multiple issues
   */
  static async bulkRemediate(issues: IntegrityIssue[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;

    // Process in chunks of 25 to avoid batch limits and complexity
    const CHUNK_SIZE = 25;
    for (let i = 0; i < issues.length; i += CHUNK_SIZE) {
      const chunk = issues.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      
      const userUpdates = new Map<string, string[]>();

      // First pass: calculate final course lists for each user in this chunk
      for (const issue of chunk) {
        if (!issue.id) continue;
        
        try {
          const userDocRef = doc(db, 'users', issue.userId);
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) continue;

          let currentCourses = userUpdates.get(issue.userId) || userSnap.data().enrolledCourses || [];

          if (issue.type === 'MISSING_COURSE' && issue.metadata?.missing) {
            currentCourses = Array.from(new Set([...currentCourses, ...issue.metadata.missing]));
          } else if (issue.type === 'EXTRA_COURSE' && issue.metadata?.extra) {
            currentCourses = currentCourses.filter((id: string) => !issue.metadata.extra.includes(id));
          } else if (issue.type === 'EMPTY_CURRICULUM' && issue.expectedCourseIds) {
            currentCourses = issue.expectedCourseIds;
          }

          userUpdates.set(issue.userId, currentCourses);
          batch.update(doc(db, this.LOG_COLLECTION, issue.id), { 
            resolved: true, 
            resolvedAt: serverTimestamp(),
            resolvedBy: 'admin_bulk'
          });
          success++;
        } catch (err) {
          failed++;
        }
      }

      // Second pass: add user updates to batch
      userUpdates.forEach((courses, userId) => {
        batch.update(doc(db, 'users', userId), { enrolledCourses: courses });
      });

      await batch.commit();
    }

    LogService.log('success', 'admin', `Bulk remediation complete: ${success} fixed, ${failed} failed`);
    return { success, failed };
  }
}
