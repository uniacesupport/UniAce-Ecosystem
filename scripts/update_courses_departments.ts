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

const ENGR_SCI_MED = ALL_DEPTS;
const MED_LIFE = ['Anatomy', 'Biology', 'Dentistry', 'Medical Laboratory Science', 'Medicine and Surgery', 'Nursing Science', 'Pharmacy', 'Physiology', 'Public Health'];
const ENGR = ['Aerospace Engineering', 'Agricultural Engineering', 'Biomedical Engineering', 'Chemical Engineering', 'Civil Engineering', 'Computer Engineering', 'Electrical Engineering', 'Material Science and Engineering', 'Mechanical Engineering', 'Mechatronics Engineering', 'Petroleum Engineering', 'Software Engineering'];
const COMP_SCI = ['Computer Science', 'Software Engineering', 'Computer Engineering'];

content = content.replace(/id:\s*'([^']+)',([\s\S]*?)department:\s*'([^']+)'/g, (match, id, middle, oldDept) => {
  let depts = [];
  if (id.startsWith('GST') || id.startsWith('MAT') || id.startsWith('PHY') || id.startsWith('CHM') || id.startsWith('STA')) {
    depts = ENGR_SCI_MED;
  } else if (id.startsWith('BIO') || id.startsWith('ZOO')) {
    depts = MED_LIFE;
  } else if (id.startsWith('GET')) {
    depts = ENGR;
  } else if (id.startsWith('COS')) {
    depts = COMP_SCI;
  } else {
    depts = [oldDept];
  }
  
  const deptsStr = JSON.stringify(depts).replace(/"/g, "'");
  return `id: '${id}',${middle}departments: ${deptsStr}`;
});

fs.writeFileSync(constantsPath, content);
console.log('Updated constants.ts');
