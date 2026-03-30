
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

// Mock data representing the 70% NUC Core for Computing (100 Level)
const MOCK_CCMAS_DATA: Record<string, CCMASCore> = {
  "Computing-100": {
    discipline: "Computing",
    level: "100",
    totalCoreUnits: 32,
    coreCourses: [
      { code: "COM 101", title: "Introduction to Computing", units: 3, description: "Basic concepts of computer science and information technology." },
      { code: "COM 112", title: "Introduction to Problem Solving", units: 3, description: "Algorithm development and basic programming logic." },
      { code: "MAT 101", title: "Elementary Mathematics I", units: 3, description: "Algebra and Trigonometry." },
      { code: "MAT 102", title: "Elementary Mathematics II", units: 3, description: "Calculus and Coordinate Geometry." },
      { code: "PHY 101", title: "General Physics I", units: 3, description: "Mechanics, Thermal Physics and Waves." },
      { code: "PHY 102", title: "General Physics II", units: 2, description: "Electricity, Magnetism and Modern Physics." },
      { code: "GST 111", title: "Communication in English I", units: 2, description: "Basic English grammar and communication skills." },
      { code: "GST 112", title: "Logic, Philosophy and Human Existence", units: 2, description: "Critical thinking and philosophical foundations." },
      { code: "GST 113", title: "Nigerian Peoples and Culture", units: 2, description: "History and culture of Nigeria." },
      { code: "GST 121", title: "Use of Library, Study Skills and ICT", units: 2, description: "Information literacy and basic ICT skills." },
      { code: "GST 122", title: "Communication in English II", units: 2, description: "Advanced communication and writing skills." },
      { code: "GST 125", title: "Introduction to Entrepreneurship", units: 2, description: "Foundations of entrepreneurial thinking." },
      { code: "CHM 101", title: "General Chemistry I", units: 3, description: "Basic principles of chemistry." }
    ]
  },
  "Science-100": {
    discipline: "Science",
    level: "100",
    totalCoreUnits: 30,
    coreCourses: [
      { code: "BIO 101", title: "General Biology I", units: 3, description: "Introduction to biology and cell theory." },
      { code: "CHM 101", title: "General Chemistry I", units: 3, description: "Basic principles of chemistry." },
      { code: "PHY 101", title: "General Physics I", units: 3, description: "Mechanics and properties of matter." },
      { code: "MAT 101", title: "Elementary Mathematics I", units: 3, description: "Algebra and Trigonometry." },
      { code: "GST 111", title: "Communication in English I", units: 2, description: "Basic English grammar and communication skills." },
      { code: "GST 112", title: "Logic, Philosophy and Human Existence", units: 2, description: "Critical thinking and philosophical foundations." }
    ]
  }
};

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
      
      // Fallback to mock data if not in Firestore yet (to prevent breaking during migration)
      return MOCK_CCMAS_DATA[coreId] || null;
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
