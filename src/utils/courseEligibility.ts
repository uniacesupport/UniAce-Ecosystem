import { Course, UserProfile, CourseId, Semester } from '../types';
import { isSameDepartment, normalizeLevel, normalizeSemester } from './normalization';

export type ProgramStatus = 'current_program' | 'global_core' | 'elective' | 'outside_program' | 'unmapped';

export interface EligibilityResult {
  isEligible: boolean;
  status: ProgramStatus;
  reason: string;
}

/**
 * Shared central engine to evaluate if a course is eligible for a student's active program,
 * explicit manual enrollments, or search/explore feeds.
 */
export const getCourseProgramStatus = (
  course: Course,
  profile: UserProfile | null,
  activeSemester?: Semester | string
): ProgramStatus => {
  if (!course) return 'unmapped';
  if (!profile?.department || !profile?.academic_level) return 'unmapped';

  const userLevel = normalizeLevel(profile.academic_level);
  const userSemester = activeSemester ? normalizeSemester(activeSemester) : (profile.semester ? normalizeSemester(profile.semester) : null);

  const courseLevel = normalizeLevel(course.level || '');
  const courseSemester = normalizeSemester(course.semester || '');

  // 1. Global Core Courses (e.g. GST, GET, General Chemistry/Physics)
  const isGlobal = course.scope === 'GLOBAL' || course.offerings?.some(o => o.type === 'global');
  if (isGlobal) {
    if (courseLevel === userLevel && (!userSemester || courseSemester === userSemester)) {
      return 'global_core';
    }
  }

  // 2. Direct Department Offering Match
  let isDepartmentMatch = false;

  if (course.offerings && course.offerings.length > 0) {
    isDepartmentMatch = course.offerings.some(offering => 
      isSameDepartment(offering.departmentId, profile.department!) || 
      (offering.departmentName && isSameDepartment(offering.departmentName, profile.department!))
    );
  } else if (course.departments && course.departments.length > 0) {
    isDepartmentMatch = course.departments.some(d => isSameDepartment(d, profile.department!));
  } else if (course.department) {
    isDepartmentMatch = isSameDepartment(course.department, profile.department!);
  }

  // If department matches AND level/semester match
  if (isDepartmentMatch) {
    if (courseLevel === userLevel && (!userSemester || courseSemester === userSemester)) {
      return 'current_program';
    }
  }

  // Check if course has progress or is explicitly enrolled but belongs to another program
  return 'outside_program';
};

/**
 * Evaluates whether a course should be rendered in "Your Courses" feed for the given profile and semester.
 */
export const isCourseEligibleForUser = (
  course: Course,
  profile: UserProfile | null,
  activeSemester: Semester | string,
  explicitEnrolledIds: CourseId[] = []
): boolean => {
  if (!course || !profile) return false;

  const userLevel = normalizeLevel(profile.academic_level || '');
  const targetSemester = normalizeSemester(activeSemester || profile.semester || '');
  const courseLevel = normalizeLevel(course.level || '');
  const courseSemester = normalizeSemester(course.semester || '');

  // Fail closed if course lacks basic level/semester or user profile is incomplete
  if (!userLevel || !targetSemester) return false;

  // Level and Semester MUST match for "Your Courses"
  if (courseLevel !== userLevel || courseSemester !== targetSemester) {
    return false;
  }

  const status = getCourseProgramStatus(course, profile, activeSemester);

  if (status === 'current_program' || status === 'global_core') {
    return true;
  }

  // Explicitly enrolled electives
  if (explicitEnrolledIds.includes(course.id)) {
    return true;
  }

  return false;
};

/**
 * Dry-run audit function to inspect and classify all catalog courses for a given user profile.
 */
export const auditUserCatalog = (
  allCourses: Record<string, Course>,
  profile: UserProfile | null,
  activeSemester: Semester | string
) => {
  const courseList = Object.values(allCourses);
  const audit = {
    total: courseList.length,
    currentProgram: [] as Course[],
    globalCore: [] as Course[],
    outsideProgram: [] as Course[],
    unmapped: [] as Course[],
  };

  courseList.forEach(course => {
    const status = getCourseProgramStatus(course, profile, activeSemester);
    if (status === 'current_program') audit.currentProgram.push(course);
    else if (status === 'global_core') audit.globalCore.push(course);
    else if (status === 'outside_program') audit.outsideProgram.push(course);
    else audit.unmapped.push(course);
  });

  return audit;
};
