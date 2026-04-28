import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEPARTMENTS as INITIAL_DEPARTMENTS, FACULTIES as INITIAL_FACULTIES, DEPARTMENT_TO_FACULTY as INITIAL_MAP } from '../constants';
import { Department } from '../types';

interface InstitutionState {
  departments: Department[];
  faculties: string[];
  departmentToFaculty: Record<string, string>;
  isLoading: boolean;
  addDepartment: (dept: string, faculty: string) => Promise<void>;
  removeDepartment: (dept: string) => Promise<void>;
  addFaculty: (faculty: string) => Promise<void>;
  removeFaculty: (faculty: string) => Promise<void>;
}

const InstitutionContext = createContext<InstitutionState | undefined>(undefined);

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [faculties, setFaculties] = useState<string[]>(INITIAL_FACULTIES);
  const [departmentToFaculty, setDepartmentToFaculty] = useState<Record<string, string>>(INITIAL_MAP);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    
    // Seed and listen to institution config
    const docRef = doc(db, 'system_config', 'institution');
    
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setDepartments(data.departments || INITIAL_DEPARTMENTS);
        setFaculties(data.faculties || INITIAL_FACULTIES);
        setDepartmentToFaculty(data.departmentToFaculty || INITIAL_MAP);
        setIsLoading(false);
      } else {
        // Document doesn't exist, create it with initial constants
        try {
          await setDoc(docRef, {
            departments: INITIAL_DEPARTMENTS,
            faculties: INITIAL_FACULTIES,
            departmentToFaculty: INITIAL_MAP
          });
        } catch (error) {
          console.error("Failed to seed institution config:", error);
          // Fallback to constants if setting fails (e.g. permission issues for non-admins)
          setIsLoading(false);
        }
      }
    }, (error) => {
      console.error("Error listening to institution config:", error);
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  const addDepartment = async (dept: string, faculty: string) => {
    if (!db) return;
    if (!departments.includes(dept)) {
      const newDepts = [...departments, dept].sort();
      const newMap = { ...departmentToFaculty, [dept]: faculty };
      await setDoc(doc(db, 'system_config', 'institution'), {
        departments: newDepts,
        departmentToFaculty: newMap
      }, { merge: true });
    }
  };

  const removeDepartment = async (dept: string) => {
    if (!db) return;
    const newDepts = departments.filter(d => d !== dept);
    const newMap = { ...departmentToFaculty };
    delete newMap[dept];
    await setDoc(doc(db, 'system_config', 'institution'), {
      departments: newDepts,
      departmentToFaculty: newMap
    }, { merge: true });
  };

  const addFaculty = async (faculty: string) => {
    if (!db) return;
    if (!faculties.includes(faculty)) {
      const newFaculties = [...faculties, faculty].sort();
      await setDoc(doc(db, 'system_config', 'institution'), {
        faculties: newFaculties
      }, { merge: true });
    }
  };

  const removeFaculty = async (faculty: string) => {
    if (!db) return;
    const newFaculties = faculties.filter(f => f !== faculty);
    await setDoc(doc(db, 'system_config', 'institution'), {
      faculties: newFaculties
    }, { merge: true });
  };

  return (
    <InstitutionContext.Provider value={{
      departments,
      faculties,
      departmentToFaculty,
      isLoading,
      addDepartment,
      removeDepartment,
      addFaculty,
      removeFaculty
    }}>
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
}
