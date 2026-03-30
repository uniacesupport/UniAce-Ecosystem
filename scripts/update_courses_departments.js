import fs from 'fs';
import path from 'path';

const constantsPath = path.join(process.cwd(), 'src', 'constants.ts');
let content = fs.readFileSync(constantsPath, 'utf-8');

const ALL_DEPTS = [
  'Aerospace Engineering', 'Agricultural Engineering', 'Anatomy', 'Biology',
  'Biomedical Engineering', 'Chemical Engineering', 'Chemistry', 'Civil Engineering',
  'Computer Engineering', 'Computer Science', 'Dentistry', 'Electrical Engineering',
  'Material Science and Engineering', 'Mathematics', 'Mechanical Engineering',
  'Mechatronics Engineering', 'Medical Laboratory Science', 'Medicine and Surgery',
  'Nursing Science', 'Petroleum Engineering', 'Pharmacy', 'Physics', 'Physiology',
  'Public Health', 'Software Engineering'
];

const ENGR_SCI_MED = ALL_DEPTS; // Basically all of them for MAT, PHY, CHM, GST
const MED_LIFE = ['Anatomy', 'Biology', 'Dentistry', 'Medical Laboratory Science', 'Medicine and Surgery', 'Nursing Science', 'Pharmacy', 'Physiology', 'Public Health'];
const ENGR = ['Aerospace Engineering', 'Agricultural Engineering', 'Biomedical Engineering', 'Chemical Engineering', 'Civil Engineering', 'Computer Engineering', 'Electrical Engineering', 'Material Science and Engineering', 'Mechanical Engineering', 'Mechatronics Engineering', 'Petroleum Engineering', 'Software Engineering'];
const COMP_SCI = ['Computer Science', 'Software Engineering', 'Computer Engineering'];

content = content.replace(/department:\s*'([^']+)'/g, (match, dept) => {
  // We need to figure out which course this is for.
  return `department: '${dept}'`; // Just a placeholder, we'll do it better.
});

fs.writeFileSync(constantsPath, content);
