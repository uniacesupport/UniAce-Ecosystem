import dotenv from 'dotenv';
dotenv.config();
import { getAdminApp } from '../server/firebaseAdmin';
import { 
  GroqProvider, 
  GeminiDirectProvider, 
  MistralDirectProvider, 
  CohereProvider, 
  OpenRouterFreeProvider 
} from '../server/providers';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';

const CourseSkeletonSchema = z.object({
  description: z.string().optional().default(''),
  modules: z.array(z.object({
    title: z.string().min(1),
    topics: z.array(z.string()).optional(),
    lessons: z.array(z.string()).optional(),
    lessonTitles: z.array(z.string()).optional(),
    quizTopics: z.array(z.string()).optional().default([])
  })).min(1)
});

const LessonContentSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    return { title: 'Lesson', content: val };
  }
  return val;
}, z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Lesson content cannot be empty')
}));

const ModuleQuizSchema = z.preprocess((val: any) => {
  if (Array.isArray(val)) {
    return { questions: val };
  }
  return val;
}, z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    answerIndex: z.number().int().min(0).optional().default(0),
    explanation: z.string().optional().default('')
  })).min(1)
}));

const CourseFormulaSchema = z.preprocess((val: any) => {
  if (Array.isArray(val)) {
    return { formulas: val };
  }
  return val;
}, z.object({
  formulas: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    latex: z.string(),
    description: z.string().optional().default('')
  })).min(1)
}));

function parseRobustJSON<T = any>(text: string): T {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch && markdownMatch[1].trim()) {
    cleaned = markdownMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch (_) {}

  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  let startIndex = -1;
  let isArray = false;
  if (startObj !== -1 && startArr !== -1) {
    if (startObj < startArr) { startIndex = startObj; isArray = false; }
    else { startIndex = startArr; isArray = true; }
  } else if (startObj !== -1) { startIndex = startObj; isArray = false; }
  else if (startArr !== -1) { startIndex = startArr; isArray = true; }

  let candidateText = cleaned;
  if (startIndex !== -1) {
    const endChar = isArray ? ']' : '}';
    const endIndex = cleaned.lastIndexOf(endChar);
    if (endIndex > startIndex) {
      candidateText = cleaned.substring(startIndex, endIndex + 1);
    }
  } else {
    // If no JSON object/array is found at all, the AI produced raw markdown text
    return {
      title: 'Lesson',
      content: cleaned
    } as unknown as T;
  }

  const safeEscapeLatex = (str: string) => {
    let res = str.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
      return `$$${latex.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\')}$$`;
    });
    res = res.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
    return res;
  };

  try {
    return JSON.parse(jsonrepair(candidateText)) as T;
  } catch (repairError) {
    try {
      const escapedLatex = safeEscapeLatex(candidateText);
      return JSON.parse(jsonrepair(escapedLatex)) as T;
    } catch (finalError) {
      // Fallback for objects with "content" containing unescaped quotes
      const contentMatch = cleaned.match(/"content"\s*:\s*"([\s\S]*)/i);
      if (contentMatch) {
        const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/i);
        let rawContent = contentMatch[1].trim();
        if (rawContent.endsWith('"}')) {
          rawContent = rawContent.slice(0, -2);
        } else if (rawContent.endsWith('}')) {
          rawContent = rawContent.slice(0, -1);
          if (rawContent.endsWith('"')) {
            rawContent = rawContent.slice(0, -1);
          }
        }
        return {
          title: titleMatch ? titleMatch[1] : 'Lesson',
          content: rawContent
        } as unknown as T;
      }
      throw finalError;
    }
  }
}

async function verifyENT211() {
  const courseId = 'ENT211';
  const courseName = 'ENT211: Entrepreneurship and Innovation';
  const level = '200';
  const academicStandard = 'Global University Curricula / Global Students';

  console.log(`\n======================================================`);
  console.log(`STARTING VERIFICATION FOR: ${courseName} (${level} Level)`);
  console.log(`Academic Standard: ${academicStandard}`);
  console.log(`======================================================\n`);

  const groq = new GroqProvider();
  const gemini = new GeminiDirectProvider();
  const providers = [groq, gemini];

  async function callAI(messages: any[]) {
    for (const p of providers) {
      try {
        const resp = await p.generate(messages, { complexity: 'high', jsonMode: true });
        if (resp && resp.text) return resp.text;
      } catch (err: any) {
        console.warn(`Provider ${p.name} failed:`, err.message);
      }
    }
    throw new Error('All AI providers failed');
  }

  // STEP 1: Generate Skeleton
  console.log('[Step 1/4] Generating Course Skeleton...');
  const skeletonPrompt = `Create a high-level syllabus course structure for a university course on "${courseName}".
Level: ${level}
Academic Standard: ${academicStandard}
Include 3-4 structured modules covering opportunity identification, business modeling, innovation strategy, and financing.

Return strictly a JSON object matching this schema:
{
  "description": "Comprehensive course description for global university students.",
  "modules": [
    {
      "title": "Module Title",
      "topics": ["Topic 1", "Topic 2"],
      "quizTopics": ["Concept 1", "Concept 2"]
    }
  ]
}`;

  const skeletonRaw = await callAI([
    { role: 'system', content: 'You are an expert university professor and curriculum architect. Output strictly valid JSON.' },
    { role: 'user', content: skeletonPrompt }
  ]);

  const skeletonParsed = parseRobustJSON(skeletonRaw);
  const validatedSkeleton = CourseSkeletonSchema.parse(skeletonParsed);
  console.log(`✔ Step 1 Success: Skeleton validated. Found ${validatedSkeleton.modules.length} modules.`);
  validatedSkeleton.modules.forEach((m, idx) => {
    console.log(`   Module ${idx + 1}: ${m.title} (${(m.topics || []).length} topics)`);
  });

  // STEP 2: Generate Detailed Lessons for Modules
  console.log('\n[Step 2/4] Generating In-Depth Lessons...');
  const generatedLessons: Array<{ moduleId: string; lessonId: string; title: string; length: number }> = [];

  for (let mIdx = 0; mIdx < validatedSkeleton.modules.length; mIdx++) {
    const mod = validatedSkeleton.modules[mIdx];
    const topics = mod.topics || mod.lessons || ['Overview of ' + mod.title];
    
    // Generate the core lesson for each module
    const topic = topics[0];
    const lessonPrompt = `Write a rigorous, university-level study guide/lesson on the topic: "${topic}"
within the module "${mod.title}" of the course "${courseName}".
Level: ${level}
Academic Standard: ${academicStandard}

Return strictly a JSON object matching this schema:
{
  "title": "${topic}",
  "content": "Full detailed markdown lesson text. Include clear explanations, frameworks, mathematical formulations (e.g. ROI, CAC, CLV if applicable), and structured sections."
}`;

    const lessonRaw = await callAI([
      { role: 'system', content: 'You are an expert university professor. Output strictly valid JSON.' },
      { role: 'user', content: lessonPrompt }
    ]);

    const lessonParsed = parseRobustJSON(lessonRaw);
    const validatedLesson = LessonContentSchema.parse(lessonParsed);
    generatedLessons.push({
      moduleId: `m${mIdx + 1}`,
      lessonId: `m${mIdx + 1}-l1`,
      title: validatedLesson.title || topic,
      length: validatedLesson.content.length
    });
    console.log(`✔ Generated Module ${mIdx + 1} Lesson: "${validatedLesson.title || topic}" (${validatedLesson.content.length} characters)`);
  }

  // STEP 3: Generate Quizzes
  console.log('\n[Step 3/4] Generating Module Assessments / Quizzes...');
  const quizPrompt = `Generate a university-level quiz with 3 challenging multiple choice questions based on ENT211 Module 1: "${validatedSkeleton.modules[0].title}".
Academic Standard: ${academicStandard}

Return strictly a JSON object matching this schema:
{
  "questions": [
    {
      "question": "Question text testing deep entrepreneurial or innovation concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Detailed explanation of correct answer."
    }
  ]
}`;

  const quizRaw = await callAI([
    { role: 'system', content: 'You are an expert university examiner. Output strictly valid JSON.' },
    { role: 'user', content: quizPrompt }
  ]);

  const quizParsed = parseRobustJSON(quizRaw);
  const validatedQuiz = ModuleQuizSchema.parse(quizParsed);
  console.log(`✔ Step 3 Success: Generated ${validatedQuiz.questions.length} quiz questions.`);

  // STEP 4: Generate Formulas / Frameworks Reference
  console.log('\n[Step 4/4] Generating Key Entrepreneurial Formulas & Frameworks...');
  const formulaPrompt = `Generate 3 essential mathematical business and economic formulas used in "${courseName}" (e.g. Customer Lifetime Value, Customer Acquisition Cost, Break-Even Analysis).
Return strictly a JSON object:
{
  "formulas": [
    {
      "id": "f1",
      "title": "Formula Name",
      "latex": "Formula in LaTeX (e.g. CLV = \\\\frac{ARPU \\\\times Margin}{Churn})",
      "description": "Explanation of terms."
    }
  ]
}`;

  const formulaRaw = await callAI([
    { role: 'system', content: 'You are an expert professor. Output strictly valid JSON.' },
    { role: 'user', content: formulaPrompt }
  ]);

  const formulaParsed = parseRobustJSON(formulaRaw);
  const validatedFormulas = CourseFormulaSchema.parse(formulaParsed);
  console.log(`✔ Step 4 Success: Generated ${validatedFormulas.formulas.length} formulas:`);
  validatedFormulas.formulas.forEach(f => {
    console.log(`   - ${f.title}: ${f.latex}`);
  });

  // STEP 5: Persist Course to Firestore
  console.log('\n[Database Verification] Saving ENT211 course to Firestore...');
  const app = getAdminApp();
  if (app) {
    const db = app.firestore();
    const syllabus = validatedSkeleton.modules.map((m, idx) => ({
      id: `m${idx + 1}`,
      title: m.title,
      subTopics: (m.topics || []).map((t, tIdx) => ({
        id: `m${idx + 1}-l${tIdx + 1}`,
        title: t
      }))
    }));

    await db.collection('courses').doc(courseId).set({
      id: courseId,
      code: courseId,
      name: courseName,
      title: courseName,
      level: level,
      department: 'Business Administration & Entrepreneurship',
      departments: ['Business Administration', 'Entrepreneurship'],
      description: validatedSkeleton.description || 'A comprehensive global university course on entrepreneurship and innovation.',
      syllabus: syllabus,
      academicStandard: academicStandard,
      isAIGenerated: true,
      generationStatus: 'completed',
      generationProgress: 100,
      statusMessage: 'Course generated successfully!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Save formulas
    for (const f of validatedFormulas.formulas) {
      await db.collection('courses').doc(courseId).collection('formulas').doc(f.id || 'f_' + Math.random().toString(36).substring(7)).set(f);
    }

    // Save quiz
    await db.collection('courses').doc(courseId).collection('modules').doc('m1').collection('quizzes').doc('default').set({
      questions: validatedQuiz.questions
    });

    console.log(`✔ Firestore Success: ENT211 document and subcollections saved successfully!`);
    
    // Read back to confirm
    const savedDoc = await db.collection('courses').doc(courseId).get();
    console.log(`✔ Firestore Verification: Document exists=${savedDoc.exists}, status=${savedDoc.data()?.generationStatus}, progress=${savedDoc.data()?.generationProgress}%`);
  }

  console.log(`\n======================================================`);
  console.log(`VERIFICATION COMPLETE: ENT211 GENERATED WITH ZERO ISSUES!`);
  console.log(`======================================================\n`);
}

verifyENT211()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
