export interface GeneratedCourse {
  description?: string;
  modules: {
    title: string;
    lessons: {
      title: string;
      content: string;
      metadata: PipelineMetadata;
    }[];
    quiz: {
      questions: {
        type: 'multiple-choice' | 'fill-in-the-blank';
        question: string;
        options?: string[];
        correctAnswer: string;
        explanation: string;
        hint: string;
      }[];
    };
  }[];
}

import { jsonrepair } from 'jsonrepair';
import { PipelineMetadata } from '../types';
const getAuthToken = async () => {
  try {
    const { auth } = await import('../firebase');
    return await auth?.currentUser?.getIdToken(true);
  } catch (e) {
    return null;
  }
};

export function sanitizeLatex(content: string): string {
  if (!content) return content;
  
  // 0. Remove markdown code block wrappers if the AI incorrectly wrapped the entire response
  let sanitized = content.replace(/^```(?:markdown)?\n([\s\S]*?)\n```$/g, '$1');
  
  // 1. Replace \[ ... \] with $$ ... $$ for block math
  sanitized = sanitized.replace(/\\\[/g, '\n$$$$\n').replace(/\\\]/g, '\n$$$$\n');
  
  // Ensure $$ is on its own line for remark-math to parse it correctly as block math
  // This prevents unclosed block math from consuming the entire document and causing KaTeX errors
  sanitized = sanitized.replace(/([^\n])\$\$/g, '$1\n$$$$');
  sanitized = sanitized.replace(/\$\$([^\n])/g, '$$$$\n$1');
  
  // 2. Replace \( ... \) with $ ... $ for inline math
  sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  // 3. Fix common AI mistakes where it might double escape backslashes in raw markdown
  // or fail to escape them in a way that the renderer expects.
  // Most common: \\frac -> \frac
  sanitized = sanitized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 4. Fix JSON escape character collisions with LaTeX macros
  // When AI fails to double-escape, JSON.parse turns \b, \f, \n, \r, \t into control characters.
  // We need to recover these back into LaTeX commands.
  sanitized = sanitized.replace(/\x08(egin|matrix|pmat|bmat|vmat|Bmat|Vmat)/g, '\\begin$1'); // \b -> \begin
  sanitized = sanitized.replace(/\x0C(rac|orm)/g, '\\f$1'); // \f -> \frac
  sanitized = sanitized.replace(/\x0A(abla|ewline|eg|u|i)/g, '\\n$1'); // \n -> \nabla, \newline, \neg, \nu, \ni
  sanitized = sanitized.replace(/\x0D(ight|eft|ho|p)/g, '\\r$1'); // \r -> \right, \left, \rho, \rp
  sanitized = sanitized.replace(/\x09(ext|heta|imes|an|au|o)/g, '\\t$1'); // \t -> \text, \theta, \times, \tan, \tau, \to

  // 5. Fix literal \n and \t strings (backslash + n/t) ONLY if they are not part of a word
  // This is safer than a global replace which breaks \nabla and \text
  sanitized = sanitized.replace(/\\n(\s|$)/g, '\n$1');
  sanitized = sanitized.replace(/\\t(\s|$)/g, '\t$1');
  
  // 6. Ensure \begin{...} and \end{...} are wrapped in $$ if they aren't already
  // This is a common issue where AI outputs raw LaTeX environments without markdown math delimiters
  const envs = ['align', 'equation', 'eqnarray', 'gather', 'multline', 'matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'];
  const envPattern = envs.join('|');
  
  // First, strip existing $$ around these environments to avoid duplicates
  const stripBeginRegex = new RegExp(`\\$\\$\\s*(\\\\begin\\{(?:${envPattern})\\*?\\})`, 'g');
  sanitized = sanitized.replace(stripBeginRegex, '$1');
  
  const stripEndRegex = new RegExp(`(\\\\end\\{(?:${envPattern})\\*?\\})\\s*\\$\\$`, 'g');
  sanitized = sanitized.replace(stripEndRegex, '$1');

  // Then, wrap all of them in $$
  const wrapBeginRegex = new RegExp(`(\\\\begin\\{(?:${envPattern})\\*?\\})`, 'g');
  sanitized = sanitized.replace(wrapBeginRegex, '\n$$$$\n$1');
  
  const wrapEndRegex = new RegExp(`(\\\\end\\{(?:${envPattern})\\*?\\})`, 'g');
  sanitized = sanitized.replace(wrapEndRegex, '$1\n$$$$\n');

  // Clean up any excessive newlines created by the above replacements
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized;
}

async function callGenerateAPI(prompt: string, type: 'skeleton' | 'module' | 'lesson', provider?: string): Promise<any> {
  const token = await getAuthToken();
  const controller = new AbortController();
  // 10 minute timeout for course generation as it can be very slow with Pro models
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch('/api/course/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ prompt, type, provider }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("Server returned an invalid response (possibly a timeout or error page). Please try again.");
    }

    if (!response.ok) {
      // Log AI failure
      import('./logService').then(({ LogService }) => {
        LogService.log('error', 'ai', `AI Generation failed for ${type}`, { error: data.error, provider });
      });
      throw new Error(data.error || 'Failed to generate course content');
    }

    const rawContent = data.text;

    // Log AI success
    import('./logService').then(({ LogService }) => {
      LogService.log('success', 'ai', `AI Generation successful for ${type}`, { provider, type });
    });

    if (!rawContent) {
      throw new Error("Failed to generate course content");
    }

    // Strip markdown code block wrappers if the AI incorrectly wrapped the response
    let content = rawContent.trim();
    if (content.startsWith('```json')) {
      content = content.substring(7);
    } else if (content.startsWith('```')) {
      content = content.substring(3);
    }
    if (content.endsWith('```')) {
      content = content.substring(0, content.length - 3);
    }
    content = content.trim();

    try {
      // Find the first JSON-like character
      const startBracket = content.indexOf('[');
      const startBrace = content.indexOf('{');
      
      let startIndex = -1;
      let isArray = false;

      if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
        startIndex = startBracket;
        isArray = true;
      } else if (startBrace !== -1) {
        startIndex = startBrace;
        isArray = false;
      }

      if (startIndex === -1) {
        throw new Error("No JSON object or array found in response");
      }
      
      let parsedData = null;
      let lastError = null;

      // Try parsing from the first '{' or '['. If it fails, try the next one.
      let currentIndex = startIndex;
      let currentIsArray = isArray;
      
      while (currentIndex !== -1 && parsedData === null) {
        let jsonToRepair = content.substring(currentIndex).trim();
        
        const closingChar = currentIsArray ? ']' : '}';
        let endIndex = content.lastIndexOf(closingChar);
        
        if (endIndex !== -1 && endIndex > currentIndex) {
          const tail = content.substring(endIndex + 1).trim();
          if (tail.length > 0 && /^[a-zA-Z]{2,}/.test(tail)) {
            jsonToRepair = content.substring(currentIndex, endIndex + 1).trim();
          }
        }
        
        try {
          const repaired = jsonrepair(jsonToRepair);
          parsedData = JSON.parse(repaired);
        } catch (e) {
          lastError = e;
          // Find the next possible start character
          const nextBracket = content.indexOf('[', currentIndex + 1);
          const nextBrace = content.indexOf('{', currentIndex + 1);
          
          if (nextBracket !== -1 && (nextBrace === -1 || nextBracket < nextBrace)) {
            currentIndex = nextBracket;
            currentIsArray = true;
          } else if (nextBrace !== -1) {
            currentIndex = nextBrace;
            currentIsArray = false;
          } else {
            currentIndex = -1;
          }
        }
      }

      if (parsedData !== null) {
        return parsedData;
      } else {
        console.error("Failed to parse extracted JSON. Last error:", lastError);
        throw new Error(`AI generated invalid JSON format: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
      }
    } catch (e) {
      console.error("Failed to parse AI JSON response. Error:", e, "Content:", content);
      throw new Error(`AI generated invalid JSON format: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Course generation timed out. The AI is taking too long to respond. Please try again.");
    }
    throw error;
  }
}

export async function generateCourseFormulas(
  courseName: string,
  courseDescription: string,
  provider?: string
): Promise<any> {
  const formulaPrompt = `
    You are an expert university professor. Generate a comprehensive list of essential formulas, equations, and theorems for the following course, ensuring they meet the NUC (National Universities Commission) curriculum standards, or dynamically adapt to the most relevant global academic benchmarks for this subject.
    
    Course Name: ${courseName}
    Description: ${courseDescription}
    
    Requirements:
    1. Generate 10-15 of the most important formulas for this course.
    2. Group them into logical categories (e.g., "Kinematics", "Thermodynamics", "Calculus", "Statistics").
    3. Provide the LaTeX representation for each formula.
    4. Provide a brief, clear description of what the formula is used for and what its variables mean.
    5. Ensure the formulas are academically rigorous and align with the latest NUC or relevant global curriculum standards.
    
    CRITICAL: You must return ONLY valid JSON matching this exact structure:
    {
      "formulas": [
        {
          "title": "Newton's Second Law",
          "latex": "F = ma",
          "description": "Relates the net force (F) acting on an object to its mass (m) and acceleration (a).",
          "category": "Dynamics"
        }
      ]
    }
    CRITICAL: Do NOT wrap the JSON in markdown blocks. Output raw JSON only.
    CRITICAL LATEX INSTRUCTIONS:
    1. You MUST use LaTeX for ALL mathematical formulas, variables, and equations.
    2. Use $ ... $ for inline math and $$ ... $$ for block math.
    3. You are outputting data to a JSON parser. You MUST double-escape all LaTeX backslashes. 
       For example, output \\\\frac instead of \\frac, and \\\\begin instead of \\begin.
    4. Do NOT use \\label{...} as it is not supported. Use \\tag{...} for equation numbering if needed.
    5. Ensure all LaTeX environments (like align, matrix, etc.) are wrapped in $$ ... $$ delimiters.
    6. Do NOT use non-standard LaTeX commands like \\ext. Use \\text{...} for plain text inside math mode.
    7. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    CRITICAL: Ensure all double quotes inside strings are properly escaped (e.g., \\"word\\").
  `;

  const result = await callGenerateAPI(formulaPrompt, 'skeleton', provider);
  
  if (!result.formulas || !Array.isArray(result.formulas)) {
    throw new Error("AI generated invalid formula format. Expected a 'formulas' array.");
  }

  return result.formulas;
}

export async function generateCourseSkeleton(
  courseName: string, 
  courseDescription: string, 
  outline?: string,
  provider?: string,
  existingModuleTitles: string[] = [],
  level?: string,
  semester?: string,
  department?: string,
  ccmasCore?: any, // New parameter for the 70% core
  tone: string = 'academic',
  depth: string = 'standard',
  sourceContext?: string
): Promise<any> {
  // Robust regex to detect if the target is a specific course code (e.g., MAT 101, PHY102, GNS 111)
  const isCourseCode = courseName.trim().match(/^[A-Z]{2,4}\s?\d{3}[A-Z]?$/i);
  const isCurriculumGen = !isCourseCode;
  
  let promptContext = "";
  if (ccmasCore && isCurriculumGen) {
    const coreList = ccmasCore.coreCourses.map((c: any) => `${c.code}: ${c.title} (${c.units} units)`).join(', ');
    promptContext = `
      This is a CCMAS-compliant curriculum generation for ${ccmasCore.discipline} at ${level} Level.
      The NUC 70% Core Courses are already defined: ${coreList}.
      Total Core Units: ${ccmasCore.totalCoreUnits}.
      
      Your task is to generate the remaining 30% of university-specific elective courses.
      Requirements for the 30% Electives:
      1. Suggest 3-5 elective courses that complement the core curriculum.
      2. Ensure the total units (Core + Electives) stay between 30 and 48 units per session.
      3. Tailor these electives to modern industry needs or specific university niches.
    `;
  }

  const skeletonPrompt = `
    ${promptContext}
    Generate a comprehensive course skeleton for a university-level course.
    
    CRITICAL: You MUST use a "Hybrid Approach" to ensure the course is both exam-relevant and deeply educational:
    1. Structure: Strictly follow the NUC (National Universities Commission) curriculum outline (weeks, topics order, what to cover) to ensure exam readiness.
    2. Depth: Use international-style depth for the content breakdown (step-by-step teaching, more examples, better breakdowns) to ensure true understanding.
    3. Pedagogical Framework: Apply Bloom's Taxonomy. Ensure the progression moves from "Remembering" to "Creating".
    
    Target: ${courseName}
    Description: ${courseDescription}
    Tone: ${tone} (e.g., academic, engaging, technical)
    Depth: ${depth} (e.g., introductory, standard, deep-dive)
    ${level ? `Level: ${level}` : ''}
    ${semester ? `Semester: ${semester}` : ''}
    ${department ? `Department: ${department}` : ''}
    ${outline ? `Course Outline / Syllabus:\n${outline}` : ''}
    ${sourceContext ? `Source Context (Prioritize this information for the structure):\n${sourceContext}` : ''}
    ${existingModuleTitles.length > 0 ? `Current Existing Modules: ${existingModuleTitles.join(', ')}` : ''}
    
    The output must be a detailed JSON object containing:
    1. A "description" field which is a concise summary of the course content (1-2 sentences), ensuring it aligns with NUC or relevant curriculum objectives.
    2. An appropriate number of modules (typically 6-12) based on the course complexity and the provided outline, structured according to the NUC curriculum.
    ${ccmasCore && isCurriculumGen ? '3. Since this is a curriculum generation, the "modules" should represent the ELECTIVE COURSES you are suggesting.' : '3. Each module should have 4 to 6 lesson titles (no content yet, just titles), structured for step-by-step learning.'}
    4. Each module should have a list of topics that will be covered in the quiz.
    
    CRITICAL: You must return ONLY valid JSON.
    CRITICAL LATEX INSTRUCTIONS:
    1. You MUST use LaTeX for ALL mathematical formulas, variables, and equations.
    2. Use $ ... $ for inline math and $$ ... $$ for block math.
    3. You are outputting data to a JSON parser. You MUST double-escape all LaTeX backslashes. 
       For example, output \\\\frac instead of \\frac, and \\\\begin instead of \\begin.
    4. Do NOT use \\label{...} as it is not supported. Use \\tag{...} for equation numbering if needed.
    5. Ensure all LaTeX environments (like align, matrix, etc.) are wrapped in $$ ... $$ delimiters.
    6. Do NOT use non-standard LaTeX commands like \\ext. Use \\text{...} for plain text inside math mode.
    7. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    CRITICAL: Ensure all double quotes inside strings are properly escaped (e.g., \\"word\\").
    CRITICAL: If generating electives for a curriculum, ensure they do not overlap with the core courses: ${ccmasCore?.coreCourses.map((c: any) => c.code).join(', ') || 'None'}.
    CRITICAL: Ensure the curriculum is robust, academically rigorous, and follows the Hybrid Approach (NUC structure + International depth).
    {
      "description": "A concise summary...",
      "modules": [
        {
          "title": "Module/Course Title",
          "lessonTitles": ["Lesson 1 Title", "Lesson 2 Title", "Lesson 3 Title", "Lesson 4 Title"],
          "quizTopics": ["Topic 1", "Topic 2", "Topic 3"]
        }
      ]
    }
  `;

  const result = await callGenerateAPI(skeletonPrompt, 'skeleton', provider);
  
  let normalizedSkeleton: any = null;

  // Normalize skeleton output: ensure it's an object with a 'modules' array
  if (Array.isArray(result)) {
    normalizedSkeleton = { modules: result };
  } else if (result && result.modules && Array.isArray(result.modules)) {
    normalizedSkeleton = result;
  } else if (result && typeof result === 'object') {
    // If it's an object but doesn't have 'modules', try to find any array property
    const possibleArray = Object.values(result).find(val => Array.isArray(val));
    if (possibleArray) {
      normalizedSkeleton = { modules: possibleArray };
    }
  }

  if (!normalizedSkeleton || !Array.isArray(normalizedSkeleton.modules) || normalizedSkeleton.modules.length === 0) {
    console.error("Failed to normalize AI skeleton response:", result);
    throw new Error("The AI failed to generate a valid course structure. Please try again or try a different AI provider.");
  }

  // Normalize each module to ensure it has the expected properties
  normalizedSkeleton.modules = normalizedSkeleton.modules.map((mod: any) => {
    if (typeof mod !== 'object' || mod === null) return mod;

    const normalizedMod = { ...mod };

    // Ensure title exists
    if (!normalizedMod.title && normalizedMod.name) {
      normalizedMod.title = normalizedMod.name;
    }

    // Ensure lessonTitles exists
    if (!normalizedMod.lessonTitles) {
      // Try common variations
      const lessons = normalizedMod.lessons || normalizedMod.lesson_titles || normalizedMod.topics;
      if (Array.isArray(lessons)) {
        normalizedMod.lessonTitles = lessons.map((l: any) => typeof l === 'string' ? l : (l.title || l.name || String(l)));
      } else {
        normalizedMod.lessonTitles = [];
      }
    }

    // Ensure quizTopics exists
    if (!normalizedMod.quizTopics) {
      const topics = normalizedMod.topics || normalizedMod.quiz_topics || normalizedMod.learning_objectives;
      if (Array.isArray(topics)) {
        normalizedMod.quizTopics = topics.map((t: any) => typeof t === 'string' ? t : (t.title || t.name || String(t)));
      } else {
        // Use lesson titles as fallback for quiz topics if missing
        normalizedMod.quizTopics = [...normalizedMod.lessonTitles];
      }
    }

    return normalizedMod;
  });
  
  return normalizedSkeleton;
}

export async function generateLessonContent(
  courseName: string,
  moduleTitle: string,
  lessonTitle: string,
  provider?: string,
  level?: string,
  department?: string,
  tone: string = 'academic',
  depth: string = 'standard',
  sourceContext?: string
): Promise<{ title: string, content: string, metadata: PipelineMetadata }> {
  const lessonPrompt = `
    You are an expert university professor. Generate a detailed, exhaustive lecture note for ONE specific lesson.
    
    CRITICAL: You MUST use the "Hybrid Approach" to ensure the content is deeply educational:
    1. Structure: Follow the NUC curriculum outline for the topic.
    2. Depth: Use international-style depth (step-by-step teaching, more examples, better breakdowns) to ensure true understanding.
    3. Pedagogical Framework: Apply Bloom's Taxonomy. Every lesson MUST include:
       - Learning Objectives (What will the student know?)
       - Key Vocabulary (Definitions of core terms)
       - Active Learning (3 "Quick Check" questions at the end of the lesson).
    
    Course: ${courseName}
    Module: ${moduleTitle}
    Lesson: ${lessonTitle}
    Tone: ${tone}
    Depth: ${depth}
    ${level ? `Level: ${level}` : ''}
    ${department ? `Department: ${department}` : ''}
    ${sourceContext ? `Source Context (Prioritize this information):\n${sourceContext}` : ''}
    
    Requirements:
    1. Write a CONCISE, high-impact, university-level lecture note in Markdown format.
    2. Target length: 800-1200 words. Focus on core concepts, key derivations, and practical examples.
    3. Use a professional, academic tone suitable for a top-tier university, but adapted to the requested Tone: ${tone}.
    4. Ensure all concepts are explained clearly and logically, using step-by-step breakdowns and multiple examples to ensure deep understanding.
    5. Use LaTeX for ALL mathematical equations, variables, and scientific notation.
    CRITICAL LATEX INSTRUCTIONS:
    1. You MUST use LaTeX for ALL mathematical formulas, variables, and equations.
    2. Use $ ... $ for inline math and $$ ... $$ for block math.
    3. You are outputting data to a JSON parser. You MUST double-escape all LaTeX backslashes. 
       For example, output \\\\frac instead of \\frac, and \\\\begin instead of \\begin.
    4. Do NOT use \\label{...} as it is not supported. Use \\tag{...} for equation numbering if needed.
    5. Ensure all LaTeX environments (like align, matrix, etc.) are wrapped in $$ ... $$ delimiters.
    6. Do NOT use non-standard LaTeX commands like \\ext. Use \\text{...} for plain text inside math mode.
    7. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    6. CRITICAL: Output ONLY valid JSON matching this structure:
    {
      "content": "The raw markdown content including Learning Objectives, Key Vocabulary, Body, and Quick Check questions...",
      "metadata": {
        "hasMath": boolean,
        "hasCode": boolean
      }
    }
    CRITICAL: Do NOT wrap the JSON in markdown blocks. Output raw JSON only.
    CRITICAL: Ensure all double quotes inside the "content" string are properly escaped (e.g., \\"word\\").
    7. CRITICAL: Ensure the lesson is COMPLETE and does not cut off abruptly. Provide a clear conclusion or summary at the end.
    8. CRITICAL: The content must be academically rigorous and align with the Hybrid Approach (NUC structure + International depth).
    9. CRITICAL: Calibrate the depth and complexity to the student's level (${level || 'University Level'}) and requested Depth: ${depth}.
  `;

  const result = await callGenerateAPI(lessonPrompt, 'lesson', provider);
  return {
    title: lessonTitle,
    content: sanitizeLatex(result.content),
    metadata: result.metadata
  };
}

export async function generateModuleQuiz(
  courseName: string,
  moduleTitle: string,
  quizTopics: string[],
  provider?: string,
  level?: string,
  department?: string
): Promise<any> {
  const quizPrompt = `
    Generate a university-level quiz for this module.
    
    CRITICAL: You MUST use the "Hybrid Approach" to ensure the quiz is both exam-relevant and deeply educational:
    1. Relevance: Questions must align with NUC curriculum standards to ensure exam readiness.
    2. Depth: Questions must be challenging and conceptual, requiring deep understanding rather than rote memorization.
    
    Course: ${courseName}
    Module: ${moduleTitle}
    Topics: ${quizTopics.join(', ')}
    ${level ? `Level: ${level}` : ''}
    ${department ? `Department: ${department}` : ''}
    
    Requirements:
    1. Generate 8-12 challenging, high-quality multiple-choice questions.
    2. Questions must test deep conceptual understanding and application of knowledge, avoiding simple rote memorization.
    3. Include a mix of difficulty levels: 20% foundational, 50% intermediate, 30% advanced/analytical.
    4. CRITICAL: Calibrate the difficulty to the student's level (${level || 'University Level'}).
    5. CRITICAL: Be concise in explanations and hints to avoid output truncation.
    6. CRITICAL: Do NOT include any conversational text, self-corrections, or "thinking out loud" inside the JSON fields. 
    7. CRITICAL: The "explanation" field must provide a detailed academic justification for the correct answer and why other options are incorrect.
    8. CRITICAL: Ensure all double quotes inside strings are properly escaped (e.g., \\"word\\").
    CRITICAL LATEX INSTRUCTIONS:
    1. You MUST use LaTeX for ALL mathematical formulas, variables, and equations.
    2. Use $ ... $ for inline math and $$ ... $$ for block math.
    3. You are outputting data to a JSON parser. You MUST double-escape all LaTeX backslashes. 
       For example, output \\\\frac instead of \\frac, and \\\\begin instead of \\begin.
    4. Do NOT use \\label{...} as it is not supported. Use \\tag{...} for equation numbering if needed.
    5. Ensure all LaTeX environments (like align, matrix, etc.) are wrapped in $$ ... $$ delimiters.
    6. Do NOT use non-standard LaTeX commands like \\ext. Use \\text{...} for plain text inside math mode.
    7. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    9. CRITICAL: For LaTeX in JSON strings, use double backslashes (e.g., "\\\\mathbf"). Do NOT use triple backslashes.
    10. CRITICAL: Ensure the quiz meets the academic standards set by NUC or relevant global guidelines, following the Hybrid Approach.
    11. Return ONLY valid JSON:
    {
      "questions": [
        {
          "type": "multiple-choice",
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "correctAnswer": "...",
          "explanation": "...",
          "hint": "..."
        }
      ]
    }
  `;

  const result = await callGenerateAPI(quizPrompt, 'module', provider);
  
  // Sanitize LaTeX in questions and explanations
  if (result && result.questions && Array.isArray(result.questions)) {
    result.questions = result.questions.map((q: any) => ({
      ...q,
      question: sanitizeLatex(q.question),
      options: Array.isArray(q.options) ? q.options.map((opt: any) => sanitizeLatex(opt)) : q.options,
      explanation: sanitizeLatex(q.explanation),
      hint: sanitizeLatex(q.hint)
    }));
  }
  
  // Normalize result: ensure it's an object with a 'questions' array
  if (Array.isArray(result)) {
    return { questions: result };
  }
  
  if (result && result.questions && Array.isArray(result.questions)) {
    return result;
  }

  // If it's an object but doesn't have 'questions', try to find any array property
  if (result && typeof result === 'object') {
    const possibleArray = Object.values(result).find(val => Array.isArray(val));
    if (possibleArray) {
      return { questions: possibleArray };
    }
  }
  
  return result;
}

export async function generateModuleContent(
  courseName: string,
  moduleSkeleton: any,
  provider?: string,
  onProgress?: (message: string) => void,
  checkCancelled?: () => boolean,
  tone: string = 'academic',
  depth: string = 'standard',
  sourceContext?: string
): Promise<any> {
  if (onProgress) onProgress(`Generating Module: ${moduleSkeleton.title}...`);

  const lessons = [];
  for (const lessonTitle of moduleSkeleton.lessonTitles) {
    if (checkCancelled && checkCancelled()) throw new Error('Generation cancelled by user.');
    if (onProgress) onProgress(`Generating Lesson: ${lessonTitle}...`);
    const lesson = await generateLessonContent(courseName, moduleSkeleton.title, lessonTitle, provider, undefined, undefined, tone, depth, sourceContext);
    lessons.push(lesson);
  }

  if (checkCancelled && checkCancelled()) throw new Error('Generation cancelled by user.');
  if (onProgress) onProgress(`Generating Quiz for: ${moduleSkeleton.title}...`);
  const quiz = await generateModuleQuiz(courseName, moduleSkeleton.title, moduleSkeleton.quizTopics, provider);

  return {
    title: moduleSkeleton.title,
    lessons,
    quiz
  };
}

export async function generateCourseContent(
  courseName: string, 
  courseDescription: string, 
  outline?: string,
  provider?: string,
  onProgress?: (progress: number, message: string) => void,
  tone: string = 'academic',
  depth: string = 'standard',
  sourceContext?: string
): Promise<GeneratedCourse> {
  
  if (onProgress) onProgress(10, "Generating course skeleton...");

  const skeleton = await generateCourseSkeleton(courseName, courseDescription, outline, provider, [], undefined, undefined, undefined, undefined, tone, depth, sourceContext);
  
  if (!skeleton || !skeleton.modules || !Array.isArray(skeleton.modules)) {
    throw new Error("Failed to generate a valid course skeleton.");
  }

  const totalModules = skeleton.modules.length;
  const finalCourse: GeneratedCourse = { 
    description: skeleton.description,
    modules: [] 
  };

  // Step 2: Generate Content for each module
  const CONCURRENCY_LIMIT = 3;
  for (let i = 0; i < totalModules; i += CONCURRENCY_LIMIT) {
    const chunk = skeleton.modules.slice(i, i + CONCURRENCY_LIMIT);
    const chunkEnd = Math.min(i + CONCURRENCY_LIMIT, totalModules);

    if (onProgress) {
      const progress = 10 + Math.round((i / totalModules) * 90);
      onProgress(progress, `Generating content for Modules ${i + 1}-${chunkEnd} of ${totalModules}...`);
    }

    try {
      const chunkPromises = chunk.map(async (moduleSkeleton: any, idx: number) => {
        const moduleContent = await generateModuleContent(courseName, moduleSkeleton, provider, undefined, () => false, tone, depth, sourceContext);
        return { index: i + idx, content: moduleContent };
      });

      const results = await Promise.all(chunkPromises);
      results.sort((a, b) => a.index - b.index);

      for (const res of results) {
        finalCourse.modules.push(res.content);
      }
    } catch (error) {
      console.error(`Failed to generate modules ${i + 1}-${chunkEnd}:`, error);
      throw new Error(`Failed to generate content for Modules ${i + 1}-${chunkEnd}. Please try again.`);
    }
  }

  if (onProgress) onProgress(100, "Course generation complete!");

  return finalCourse;
}
