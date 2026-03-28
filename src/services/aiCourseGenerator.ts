export interface GeneratedCourse {
  description?: string;
  modules: {
    title: string;
    lessons: {
      title: string;
      content: string;
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
const getAuthToken = async () => {
  try {
    const { auth } = await import('../firebase');
    return await auth?.currentUser?.getIdToken();
  } catch (e) {
    return null;
  }
};

export function sanitizeLatex(content: string): string {
  if (!content) return content;
  
  // 0. Remove markdown code block wrappers if the AI incorrectly wrapped the entire response
  let sanitized = content.replace(/^```(?:markdown)?\n([\s\S]*?)\n```$/g, '$1');
  
  // 1. Replace \[ ... \] with $$ ... $$ for block math
  sanitized = sanitized.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$');
  
  // 2. Replace \( ... \) with $ ... $ for inline math
  sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  // 3. Fix common AI mistakes where it might double escape backslashes in raw markdown
  // or fail to escape them in a way that the renderer expects.
  // Most common: \\frac -> \frac
  sanitized = sanitized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 4. Ensure math blocks have newlines around them for better rendering
  sanitized = sanitized.replace(/\$\$([^\$]+)\$\$/g, (match, p1) => {
    return `\n\n$$\n${p1.trim()}\n$$\n\n`;
  });

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

    const content = data.text;

    // Log AI success
    import('./logService').then(({ LogService }) => {
      LogService.log('success', 'ai', `AI Generation successful for ${type}`, { provider, type });
    });

    if (!content) {
      throw new Error("Failed to generate course content");
    }

    if (type === 'lesson') {
      return content.replace(/^```markdown\s*/i, '').replace(/```\s*$/, '').trim();
    }

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
      
      // Try to find the last closing bracket/brace
      const closingChar = isArray ? ']' : '}';
      let endIndex = content.lastIndexOf(closingChar);
      
      // If the JSON is truncated, endIndex might be pointing to an internal bracket.
      // We'll try to use jsonrepair on the substring from startIndex to the end of the content.
      // jsonrepair is excellent at fixing truncated JSON by adding missing closing characters.
      let jsonToRepair = content.substring(startIndex).trim();
      
      // If we found a closing character, and there's significant non-whitespace text after it,
      // we might want to truncate at that character to avoid feeding conversational tail to jsonrepair.
      // However, for truncated responses, we usually want everything to the end.
      if (endIndex !== -1 && endIndex > startIndex) {
        const tail = content.substring(endIndex + 1).trim();
        // If the tail is short or looks like it could be part of the JSON (e.g. just whitespace or a few chars),
        // we keep it. If it looks like a new sentence, we might have found the actual end.
        if (tail.length > 0 && /^[a-zA-Z]{2,}/.test(tail)) {
          jsonToRepair = content.substring(startIndex, endIndex + 1).trim();
        }
      }
      
      try {
        // JSON Repair
        const repaired = jsonrepair(jsonToRepair);
        return JSON.parse(repaired);
      } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonToRepair);
        throw new Error(`AI generated invalid JSON format: ${e instanceof Error ? e.message : String(e)}`);
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
  provider: string = 'mistral'
): Promise<any> {
  const formulaPrompt = `
    You are an expert university professor. Generate a comprehensive list of essential formulas, equations, and theorems for the following course.
    
    Course Name: ${courseName}
    Description: ${courseDescription}
    
    Requirements:
    1. Generate 10-15 of the most important formulas for this course.
    2. Group them into logical categories (e.g., "Kinematics", "Thermodynamics", "Calculus", "Statistics").
    3. Provide the LaTeX representation for each formula.
    4. Provide a brief, clear description of what the formula is used for and what its variables mean.
    
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
    CRITICAL: Escape all backslashes in LaTeX strings (e.g., "\\\\frac{a}{b}").
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
  provider: string = 'mistral',
  existingModuleTitles: string[] = []
): Promise<any> {
  const skeletonPrompt = `
    Generate a comprehensive course skeleton for a university-level course.
    Course Name: ${courseName}
    Description: ${courseDescription}
    ${outline ? `Course Outline / Syllabus:\n${outline}` : ''}
    ${existingModuleTitles.length > 0 ? `Current Existing Modules: ${existingModuleTitles.join(', ')}` : ''}
    
    The output must be a detailed JSON object containing:
    1. A "description" field which is a concise summary of the course content (1-2 sentences).
    2. An appropriate number of modules (typically 6-12) based on the course complexity and the provided outline. Ensure the curriculum is comprehensive and logically structured.
    3. Each module should have 4 to 6 lesson titles (no content yet, just titles).
    4. Each module should have a list of topics that will be covered in the quiz.
    
    CRITICAL: You must return ONLY valid JSON.
    CRITICAL: Do NOT use LaTeX or special characters (like backslashes) in titles or topics. Use plain text only.
    CRITICAL: All backslashes in your JSON output must be escaped. For example, use '\\\\' instead of '\\'. Ensure all newlines within string values are represented as '\\n'.
    CRITICAL: If existing modules are provided, do NOT repeat their titles. Focus on expanding the curriculum.
    {
      "description": "A concise summary of the course...",
      "modules": [
        {
          "title": "Module Title",
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
  provider: string = 'mistral'
): Promise<any> {
  const lessonPrompt = `
    You are an expert university professor. Generate a detailed, exhaustive lecture note for ONE specific lesson.
    
    Course: ${courseName}
    Module: ${moduleTitle}
    Lesson: ${lessonTitle}
    
    Requirements:
    1. Write a CONCISE, high-impact, university-level lecture note in Markdown format.
    2. Target length: 600-900 words. Focus on core concepts, key derivations, and practical examples. Avoid unnecessary filler content.
    3. Use a professional, academic tone suitable for a top-tier university.
    4. Ensure all concepts are explained clearly and logically.
    5. Use LaTeX for ALL mathematical equations, variables, and scientific notation.
    6. CRITICAL: Use $ ... $ for inline math and $$ ... $$ for block math. Ensure LaTeX commands are properly formatted (e.g., use \\frac{a}{b} not frac{a}{b}).
    7. CRITICAL: Output ONLY raw Markdown. Do NOT output JSON. Do not wrap in \`\`\`markdown. Just the raw text.
    8. CRITICAL: Ensure the lesson is COMPLETE and does not cut off abruptly. Provide a clear conclusion or summary at the end.
  `;

  const rawMarkdown = await callGenerateAPI(lessonPrompt, 'lesson', provider);
  return {
    title: lessonTitle,
    content: sanitizeLatex(rawMarkdown)
  };
}

export async function generateModuleQuiz(
  courseName: string,
  moduleTitle: string,
  quizTopics: string[],
  provider: string = 'groq'
): Promise<any> {
  const quizPrompt = `
    Generate a university-level quiz for this module.
    Course: ${courseName}
    Module: ${moduleTitle}
    Topics: ${quizTopics.join(', ')}
    
    Requirements:
    1. Generate 8-12 challenging, high-quality multiple-choice questions.
    2. Questions must test deep conceptual understanding and application of knowledge, avoiding simple rote memorization.
    3. Include a mix of difficulty levels: 20% foundational, 50% intermediate, 30% advanced/analytical.
    4. CRITICAL: Be concise in explanations and hints to avoid output truncation.
    5. CRITICAL: Do NOT include any conversational text, self-corrections, or "thinking out loud" inside the JSON fields. 
    6. CRITICAL: The "explanation" field must provide a detailed academic justification for the correct answer and why other options are incorrect.
    7. CRITICAL: Ensure all double quotes inside strings are properly escaped.
    8. CRITICAL: For LaTeX in JSON strings, use double backslashes (e.g., "\\\\mathbf"). Do NOT use triple backslashes.
    9. Return ONLY valid JSON:
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
  provider: string = 'mistral',
  onProgress?: (message: string) => void,
  checkCancelled?: () => boolean
): Promise<any> {
  if (onProgress) onProgress(`Generating Module: ${moduleSkeleton.title}...`);

  const lessons = [];
  for (const lessonTitle of moduleSkeleton.lessonTitles) {
    if (checkCancelled && checkCancelled()) throw new Error('Generation cancelled by user.');
    if (onProgress) onProgress(`Generating Lesson: ${lessonTitle}...`);
    const lesson = await generateLessonContent(courseName, moduleSkeleton.title, lessonTitle, provider);
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
  provider: string = 'mistral',
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedCourse> {
  
  if (onProgress) onProgress(10, "Generating course skeleton...");

  const skeleton = await generateCourseSkeleton(courseName, courseDescription, outline, provider);
  
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
        const moduleContent = await generateModuleContent(courseName, moduleSkeleton, provider, undefined, () => false);
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
