
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface CCMASCourse {
  code: string;
  title: string;
  units: number;
  description: string;
}

export interface CCMASCore {
  discipline: string;
  level: string;
  coreCourses: CCMASCourse[];
  totalCoreUnits: number;
}

// Fallback CCMAS data if Firestore fails or needs seeding
const MOCK_CCMAS_DATA: Record<string, CCMASCore> = {};

// CCMAS Core data is loaded from Firestore

export const CCMASService = {
  getCoreCurriculum: async (department: string, level: string): Promise<CCMASCore | null> => {
    // Map departments to CCMAS disciplines
    const disciplineMap: Record<string, string> = {
      'Computer Science': 'Computing',
      'Software Engineering': 'Computing',
      'Computer Engineering': 'Computing',
      'Information Technology': 'Computing',
      'Cybersecurity': 'Computing',
      'Data Science': 'Computing',
      'Biology': 'Science',
      'Chemistry': 'Science',
      'Physics': 'Science',
      'Mathematics': 'Science'
    };

    const discipline = disciplineMap[department] || 'General';
    const coreId = `${discipline}-${level}`;
    const path = `ccmas_cores/${coreId}`;
    
    try {
      const coreDoc = await getDoc(doc(db, 'ccmas_cores', coreId));
      if (coreDoc.exists()) {
        return coreDoc.data() as CCMASCore;
      }
      
      return null;
    } catch (error: any) {
      if (error.message?.includes('insufficient permissions')) {
        const errInfo = {
          error: error.message,
          operationType: 'get',
          path: path,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
              providerId: provider.providerId,
              displayName: provider.displayName,
              email: provider.email,
              photoUrl: provider.photoURL
            })) || []
          }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        // We don't throw here because we have a fallback, but we log it correctly
      } else {
        console.error("Error fetching CCMAS core:", error);
      }
      return MOCK_CCMAS_DATA[coreId] || null;
    }
  },

  seedCCMASData: async (): Promise<void> => {
    console.log("Seeding CCMAS Core Standards to Firestore...");
    for (const [id, data] of Object.entries(MOCK_CCMAS_DATA)) {
      const path = `ccmas_cores/${id}`;
      try {
        await setDoc(doc(db, 'ccmas_cores', id), data);
        console.log(`Successfully seeded: ${id}`);
      } catch (error: any) {
        if (error.message?.includes('insufficient permissions')) {
          const errInfo = {
            error: error.message,
            operationType: 'write',
            path: path,
            authInfo: {
              userId: auth.currentUser?.uid,
              email: auth.currentUser?.email,
              emailVerified: auth.currentUser?.emailVerified,
              isAnonymous: auth.currentUser?.isAnonymous,
              tenantId: auth.currentUser?.tenantId,
              providerInfo: auth.currentUser?.providerData.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                email: provider.email,
                photoUrl: provider.photoURL
              })) || []
            }
          };
          console.error('Firestore Error: ', JSON.stringify(errInfo));
          throw new Error(JSON.stringify(errInfo));
        }
        console.error(`Failed to seed ${id}:`, error);
        throw error;
      }
    }
  }
};
