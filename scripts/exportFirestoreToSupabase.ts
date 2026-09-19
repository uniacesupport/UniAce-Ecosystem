import dotenv from 'dotenv';
dotenv.config();

import { exportFirestoreToSupabase } from '../server/db/exporter';

async function main() {
  console.log('--- UniAce Mastery Hub: Firestore to Supabase Migration Exporter ---');
  console.log('Starting static collection extraction...');

  try {
    const summary = await exportFirestoreToSupabase();
    console.log('\nMigration Summary:');
    console.log(`- Timestamp: ${summary.timestamp}`);
    console.log(`- Destination: ${summary.destination}`);
    console.log(`- Departments Exported: ${summary.departmentsExported}`);
    console.log(`- Courses Exported: ${summary.coursesExported}`);
    console.log(`- Curriculum Exported: ${summary.curriculumExported}`);
    console.log(`- Past Papers Exported: ${summary.pastPapersExported}`);
    console.log(`- Question Bank Items Exported: ${summary.questionBankExported}`);

    if (summary.errors.length > 0) {
      console.error('\nWarnings / Errors Encountered:');
      summary.errors.forEach(err => console.error(` [!] ${err}`));
    } else {
      console.log('\nMigration export executed smoothly with 0 errors!');
    }
  } catch (err) {
    console.error('Migration script failed fatally:', err);
    process.exit(1);
  }
}

main();
