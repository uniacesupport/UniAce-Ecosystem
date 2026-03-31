import { Department, Level, Semester } from '../types';

export const DEPARTMENTS: Department[] = [
  'Aerospace Engineering', 'Agricultural Engineering', 'Anatomy', 'Biology', 
  'Biomedical Engineering', 'Chemical Engineering', 'Chemistry', 'Civil Engineering', 
  'Computer Engineering', 'Computer Science', 'Dentistry', 'Electrical Engineering', 
  'Material Science and Engineering', 'Mathematics', 'Mechanical Engineering', 
  'Mechatronics Engineering', 'Medical Laboratory Science', 'Medicine and Surgery', 
  'Nursing Science', 'Petroleum Engineering', 'Pharmacy', 'Physics', 'Physiology', 
  'Public Health', 'Software Engineering', 'General Studies', 'General Engineering Training', 'Zoology'
];

export const LEVELS: Level[] = ['100', '200', '300', '400', '500'];
export const SEMESTERS: Semester[] = ['1st Semester', '2nd Semester'];

const DEPT_MAPPINGS: Record<string, Department> = {
  'MSE': 'Material Science and Engineering',
  'Material Science': 'Material Science and Engineering',
  'Materials Science': 'Material Science and Engineering',
  'MECH': 'Mechanical Engineering',
  'Mechanical Eng': 'Mechanical Engineering',
  'ELECT': 'Electrical Engineering',
  'Electrical Eng': 'Electrical Engineering',
  'CIVIL': 'Civil Engineering',
  'Civil Eng': 'Civil Engineering',
  'COMP': 'Computer Engineering',
  'Computer Eng': 'Computer Engineering',
  'CS': 'Computer Science',
  'SE': 'Software Engineering',
  'Software Eng': 'Software Engineering',
  'GST': 'General Studies',
  'GET': 'General Engineering Training',
  // Add more mappings as needed
};

export const normalizeDepartment = (input: string): Department | null => {
  const trimmed = input.trim();
  
  // Direct match
  if (DEPARTMENTS.includes(trimmed as Department)) {
    return trimmed as Department;
  }
  
  // Mapping match
  if (DEPT_MAPPINGS[trimmed]) {
    return DEPT_MAPPINGS[trimmed];
  }
  
  // Case-insensitive search
  const lower = trimmed.toLowerCase();
  const found = DEPARTMENTS.find(d => d.toLowerCase() === lower);
  if (found) return found;
  
  // Partial match search in mappings
  for (const [key, value] of Object.entries(DEPT_MAPPINGS)) {
    if (lower.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
};

export const normalizeLevel = (input: string): Level | null => {
  const match = input.match(/\d+/);
  if (match) {
    const num = match[0];
    if (LEVELS.includes(num as Level)) {
      return num as Level;
    }
  }
  return null;
};

export const normalizeSemester = (input: string): Semester | null => {
  const lower = input.toLowerCase();
  if (lower.includes('1') || lower.includes('first')) return '1st Semester';
  if (lower.includes('2') || lower.includes('second')) return '2nd Semester';
  return null;
};
