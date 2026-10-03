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
import { autoHealQuestion } from './validators/aiSchemas';
import { sanitizeForFirestore } from './courseService';
import { auth } from '../firebase';

const getAuthToken = async () => {
  try {
    return await auth?.currentUser?.getIdToken(true);
  } catch (e) {
    return null;
  }
};

export function flagOffTopicDrift(content: string, courseName: string, department?: string): { hasDrift: boolean; hits: string[] } {
  // Positive domain fidelity: check that the content contains vocabulary relevant to the course
  const normCourse = (courseName || '').toLowerCase();
  const lowerContent = (content || '').toLowerCase();
  const stopWords = new Set(['and', 'the', 'of', 'in', 'to', 'for', 'with', 'a', 'an', 'introduction', 'introductory', 'fundamentals', 'principles']);
  const tokens = normCourse.split(/[^a-z0-9]+/).filter(t => t.length > 2 && !stopWords.has(t));
  
  if (tokens.length === 0) return { hasDrift: false, hits: [] };
  const matches = tokens.filter(t => lowerContent.includes(t));
  const hasDrift = matches.length === 0 && lowerContent.length > 500;

  return {
    hasDrift,
    hits: hasDrift ? ['Missing core course title vocabulary'] : []
  };
}

export function sanitizeLatex(content: any): any {
  if (content === null || content === undefined) return content;
  if (typeof content !== 'string') return content;
  
  // Fix any \infinity or infinity with backslash in the raw text to \infty for KaTeX compatibility
  let sanitized = content.replace(/\\infinity\b/gi, '\\infty');
  
  // 0. Remove markdown code block wrappers if the AI incorrectly wrapped the entire response
  sanitized = sanitized.replace(/^```(?:markdown)?\n([\s\S]*?)\n```$/g, '$1');

  // 0.1. Disable indented code blocks by reducing any indentation that is 4 or more spaces to 2 spaces
  // (unless it's inside a fenced code block with ```). This prevents accidental indented code blocks.
  const lines = sanitized.split('\n');
  let inFencedCodeBlock = false;
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('```')) {
      inFencedCodeBlock = !inFencedCodeBlock;
      return line;
    }
    if (inFencedCodeBlock) {
      return line;
    }
    const match = line.match(/^(\s+)(.*)/);
    if (match) {
      const indent = match[1];
      const rest = match[2];
      if (indent.includes('\t') || indent.length >= 4) {
        return '  ' + rest;
      }
    }
    return line;
  });
  sanitized = processedLines.join('\n');
  
  // 0.5. Replace Unicode square root √ with LaTeX \sqrt{}
  // Handle √ followed by parentheses, numbers, or variables, and ensure it catches cases without parentheses
  sanitized = sanitized.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  sanitized = sanitized.replace(/√([a-zA-Z0-9^+\-*/]+)/g, '\\sqrt{$1}');
  
  // 1. Replace \[ ... \] with $$ ... $$ for block math
  sanitized = sanitized.replace(/\\\[/g, '\n$$$$\n').replace(/\\\]/g, '\n$$$$\n');
  
  // Ensure $$ is on its own line for remark-math to parse it correctly as block math
  // This prevents unclosed block math from consuming the entire document and causing KaTeX errors
  // sanitized = sanitized.replace(/([^\n])\$\$/g, '$1\n$$$$');
  // sanitized = sanitized.replace(/\$\$([^\n])/g, '$$$$\n$1');
  
  // 2. Replace \( ... \) with $ ... $ for inline math
  sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  // 3. Fix common AI mistakes where it might double escape backslashes in raw markdown
  // or fail to escape them in a way that the renderer expects.
  // Most common: \\frac -> \frac
  sanitized = sanitized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 4. Fix JSON escape character collisions with LaTeX macros
  // When AI fails to double-escape, JSON.parse turns \b, \f, \n, \r, \t into control characters.
  // We need to recover these back into LaTeX commands.
  sanitized = sanitized.replace(/\x08(egin|matrix|pmat|bmat|vmat|Bmat|Vmat)/g, '\\b$1'); // \b -> \begin
  sanitized = sanitized.replace(/\x0C(rac|orm)/g, '\\f$1'); // \f -> \frac
  sanitized = sanitized.replace(/\x0A(abla|ewline|eg|u|i)/g, '\\n$1'); // \n -> \nabla, \newline, \neg, \nu, \ni
  sanitized = sanitized.replace(/\x0D(ight|eft|ho|p)/g, '\\r$1'); // \r -> \right, \left, \rho, \rp
  sanitized = sanitized.replace(/\x09(ext|heta|imes|an|au|o)/g, '\\t$1'); // \t -> \text, \theta, \times, \tan, \tau, \to

  // 5. Fix literal \n and \t strings (backslash + n/t) that should be actual newlines/tabs
  // This happens when AI double-escapes newlines in JSON.
  // We replace \n with actual newline ONLY if it's not followed by a lowercase letter 
  // that would make it a LaTeX command (like \nabla, \newline, \nu, \ni, \neg)
  // This safely handles \nBy, \n1., \n#, \n\n while preserving \nabla.
  sanitized = sanitized.replace(/\\n(?![a-z])/g, '\n');
  sanitized = sanitized.replace(/\\t(?![a-z])/g, '\t');
  
  // 5.5 Fix missing backslashes for begin and end environments (e.g. if jsonrepair stripped them)
  // It is safe to replace begin{ and end{ because they don't occur in normal English
  sanitized = sanitized.replace(/(^|[^\\])begin\{/g, '$1\\begin{');
  sanitized = sanitized.replace(/(^|[^\\])end\{/g, '$1\\end{');
  
  // Also fix other common math commands that might have lost their backslash
  // Only match if they are NOT preceded by a backslash or a letter
  sanitized = sanitized.replace(/(^|[^a-zA-Z\\])(cdot|rightarrow|leftarrow|Rightarrow|Leftarrow|infty|alpha|beta|gamma|delta|theta|omega|pi|sigma|mu|lambda)(?=[^a-zA-Z]|$)/g, '$1\\$2');
  sanitized = sanitized.replace(/(^|[^a-zA-Z\\])(sum|int)_?\{/g, '$1\\$2_{');
  sanitized = sanitized.replace(/(^|[^a-zA-Z\\])frac\{/g, '$1\\frac{');

  // 5.6 Cleanup any duplicated prefixes caused by previous buggy sanitizeLatex versions
  sanitized = sanitized.replace(/\\beginegin/g, '\\begin');
  sanitized = sanitized.replace(/\\ffrac/g, '\\frac');
  sanitized = sanitized.replace(/\\nnabla/g, '\\nabla');
  sanitized = sanitized.replace(/\\nnewline/g, '\\newline');
  sanitized = sanitized.replace(/\\nneg/g, '\\neg');
  sanitized = sanitized.replace(/\\nnu/g, '\\nu');
  sanitized = sanitized.replace(/\\nni/g, '\\ni');
  sanitized = sanitized.replace(/\\rright/g, '\\right');
  sanitized = sanitized.replace(/\\lleft/g, '\\left');
  sanitized = sanitized.replace(/\\rrho/g, '\\rho');
  sanitized = sanitized.replace(/\\ttext/g, '\\text');
  sanitized = sanitized.replace(/\\ttheta/g, '\\theta');
  sanitized = sanitized.replace(/\\ttimes/g, '\\times');
  sanitized = sanitized.replace(/\\ttan/g, '\\tan');
  sanitized = sanitized.replace(/\\ttau/g, '\\tau');
  
  // 5.7 Cleanup AI over-applying LaTeX backslashes to common English words
  // This happens when AI follows "double-escape backslashes" too literally for words like "end"
  sanitized = sanitized.replace(/\\end(\s+)/g, 'end$1');
  
  // 5.7.1 Fix missing backslashes for all math/logic/set keywords inside math blocks or interval notations
  const mathKeywords = [
    'cup', 'cap', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 
    'setminus', 'emptyset', 'varnothing', 'infty', 'forall', 'exists', 
    'implies', 'iff', 'to', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 
    'approx', 'times', 'pm', 'div', 'cdot', 'alpha', 'beta', 'gamma', 
    'delta', 'theta', 'omega', 'pi', 'sigma', 'mu', 'lambda', 'tau', 
    'phi', 'psi'
  ];

  const fixMathKeywords = (mathContent: string) => {
    let fixed = mathContent;
    // Fix infinity -> infty
    fixed = fixed.replace(/\\?infinity\b/gi, 'infty');
    for (const kw of mathKeywords) {
      const regex = new RegExp(`(?<!\\\\)\\b${kw}\\b`, 'g');
      fixed = fixed.replace(regex, `\\${kw}`);
    }
    return fixed;
  };

  // Inside $$...$$ block math
  sanitized = sanitized.replace(/\$\$([\s\S]+?)\$\$/g, (match, mathContent) => {
    let fixedContent = mathContent.trim();
    if (fixedContent.endsWith('\\') && !fixedContent.endsWith('\\\\')) {
      fixedContent = fixedContent.slice(0, -1);
    }
    return `$$${fixMathKeywords(fixedContent)}$$`;
  });

  // Inside $...$ inline math
  sanitized = sanitized.replace(/\$([^$\n]+?)\$/g, (match, mathContent) => {
    let fixedContent = mathContent.trim();
    if (fixedContent.endsWith('\\') && !fixedContent.endsWith('\\\\')) {
      fixedContent = fixedContent.slice(0, -1);
    }
    
    // Heuristic: If it looks like a runaway math block that consumed plain text, don't fix keywords
    const stripped = fixedContent.replace(/\\(text|mathrm|textbf|textit)\{.*?\}/g, '');
    const words = stripped.match(/(?<!\\)[a-zA-Z]{3,}/g) || [];
    if (words.length >= 3) {
      return `$${fixedContent}$`; // Return as-is without fixing keywords
    }
    
    return `$${fixMathKeywords(fixedContent)}$`;
  });

  // For cases outside of math blocks that look exactly like interval notation (e.g. )cup( or ) cup ( )
  sanitized = sanitized.replace(/(?<=[)\]])\s*(cup|cap)\s*(?=[([\]])/gi, (match, p1) => {
    return p1.toLowerCase() === 'cup' ? '\\cup' : '\\cap';
  });
  
  // 5.8 Cleanup trailing backslashes that AI adds to the end of lines (LaTeX style newlines in markdown)
  // This happens when AI gets confused and uses \\ for newlines in regular text
  // We only remove it if it's at the end of a line and not preceded by a letter (which would be a command)
  sanitized = sanitized.replace(/([^a-zA-Z\\])\\\s*(\n|$)/g, '$1$2');
  sanitized = sanitized.replace(/^\\\s*(\n|$)/gm, '$1');
  
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

    // If server already returned validated structured data, return it directly
    if (data.data && typeof data.data === 'object') {
      return data.data;
    }

    const rawContent = data.text;

    // Log AI success
    import('./logService').then(({ LogService }) => {
      LogService.log('success', 'ai', `AI Generation successful for ${type}`, { provider, type });
    });

    if (!rawContent) {
      throw new Error("Failed to generate course content");
    }

    // 1. Strip internal reasoning <think>...</think>
    let content = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Strip markdown code block wrappers if present
    const mdMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (mdMatch && mdMatch[1].trim()) {
      content = mdMatch[1].trim();
    }

    try {
      // Try direct JSON.parse first
      try {
        return JSON.parse(content);
      } catch (_) {}

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
          jsonToRepair = content.substring(currentIndex, endIndex + 1).trim();
        }
        
        // Pre-process to fix common unescaped LaTeX commands and characters in JSON
        try {
          jsonToRepair = jsonToRepair.replace(/(?<!\\)\\(.)/g, (match, char, offset, fullString) => {
            if (char === '"' || char === '\\' || char === '/' || char === 'b' || char === 'f' || char === 'n' || char === 'r' || char === 't') {
              return match;
            }
            if (char === 'u') {
              const remaining = fullString.substring(offset + 2);
              if (/^[0-9a-fA-F]{4}/.test(remaining)) {
                return match;
              }
            }
            return '\\\\' + char;
          });
        } catch (e) {
          console.warn('LaTeX pre-processing failed, skipping', e);
        }
        
        try {
          const repaired = jsonrepair(jsonToRepair);
          parsedData = JSON.parse(repaired);
        } catch (e) {
          lastError = e;
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
    You are an expert university professor. Generate a comprehensive list of essential formulas, equations, and theorems for the following course, ensuring they dynamically adapt to accredited global academic benchmarks and modern university curricula for this subject.
    
    Course Name: ${courseName}
    Description: ${courseDescription}
    
    Requirements:
    1. Generate 10-15 of the most important formulas for this course.
    2. Group them into logical and specific academic categories (e.g., "Vector Calculus", "Electrostatics", "Thermodynamics").
    3. Proactively suggest these categories based on the ${courseName} and its ${courseDescription}.
    4. Provide the LaTeX representation for each formula.
    5. Provide a brief, clear description of what the formula is used for and what its variables mean.
    6. Ensure the formulas are academically rigorous and align with accredited global university curriculum standards.
    
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
    6. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
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
  curriculumBenchmark?: any, // Globally adaptive curriculum benchmark
  tone: string = 'academic',
  depth: string = 'standard',
  sourceContext?: string,
  academicStandard: string = 'Globally Adaptive (Universal University Standard)',
  scope?: string,
  selectedFaculties: string[] = [],
  selectedDepartments: string[] = []
): Promise<any> {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes for multi-agent audit

  try {
    const res = await fetch('/api/course/generate-skeleton', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        courseName,
        courseCode: courseName,
        department,
        scope,
        level,
        semester,
        tone,
        depth,
        outline,
        sourceText: sourceContext,
        academicStandard,
        provider,
        selectedFaculties,
        selectedDepartments
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (text.includes('<!doctype') || text.includes('Starting Server') || !res.ok) {
        throw new Error('Application server is warming up or temporarily unavailable. Please retry in a few moments.');
      }
      throw new Error(`Unexpected server response format (${res.status}).`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server failed to generate course structure (${res.status}).`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('generateCourseSkeleton error:', err?.message || err);
    throw err;
  }
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
  sourceContext?: string,
  academicStandard: string = 'Globally Adaptive (Universal University Standard)'
): Promise<{ title: string, content: string, metadata: PipelineMetadata }> {
  const targetDept = department?.trim() || 'the specified academic discipline';

  const comparisonInstruction = `Enforce Comparative and Multi-Dimensional Explanations: You MUST structure complex topics using clear Comparison Tables relevant specifically to "${targetDept}" and "${courseName}" — for example, compare the core theoretical models, methodologies, classifications, structural frameworks, or empirical systems that an accredited university student of "${courseName}" under "${academicStandard}" must contrast, using ONLY "${targetDept}" terminology and relevant domain frameworks. Ensure all Markdown tables follow standard GFM format with a proper header row, separator row (|---|), and data rows. Never compress tables into a single line.`;

  const caseStudyInstruction = `Incorporate Domain-Specific Case Studies: You MUST inject at least one comprehensive case study, empirical/clinical scenario, laboratory derivation, or concrete real-world application strictly native to "${courseName}" within "${targetDept}" (anchoring only the theory of this specific academic discipline).`;

  const positiveFidelityInstruction = `AUTHORITATIVE SUBJECT & DOMAIN FIDELITY:
  - The subject matter of "${courseName}" is authoritative and non-negotiable.
  - You MUST teach the authentic core principles, terminology, theories, derivations, and case studies belonging directly to "${courseName}".
  - Tailor your explanations, pacing, and relatable examples for students in "${targetDept}", but NEVER dilute, evade, or substitute the real disciplinary content of "${courseName}".`;

  const lessonPrompt = `
    You are an expert university professor in the domain of "${courseName}". Your task is to write an extremely comprehensive, long-form academic lesson for the topic "${lessonTitle}" which is part of the module "${moduleTitle}" in the university course "${courseName}".
    
    ACADEMIC STANDARD & CURRICULUM BENCHMARK:
    Calibrate all content, pedagogical depth, vocabulary, and assessment criteria to the academic standard: "${academicStandard}".
    
    ${positiveFidelityInstruction}

    CRITICAL LECTURER GUIDELINES & GLOBALLY ADAPTIVE FRAMEWORK:
    You MUST dynamically adapt the content to ensure it is deeply educational, blending world-class university standards with rigorous accreditation criteria under "${academicStandard}":
    1. Structure: Follow an accredited university curriculum outline for the topic, dynamically adapted to "${academicStandard}" in "${targetDept}" to ensure absolute exam relevance, professional depth, and international applicability.
    2. Depth: Calibrated to "${academicStandard}", use top-tier international depth (top-tier global standards such as MIT, Stanford, Oxford, Cambridge) with step-by-step teaching, rigorous derivations, and extensive conceptual breakdowns to ensure true mastery.
    3. Pedagogical Framework: Apply Bloom's Taxonomy aligned with "${academicStandard}". Every lesson MUST include:
       - Learning Objectives (What will the student know?)
       - The "Why" Before the "How" Introduction: Introduce this chapter by stating why understanding these concepts and interrelationships is essential for professionals and scholars in "${targetDept}", moving away from dry definitions to practical importance.
       - Key Vocabulary (In-depth definitions of core terms aligned with "${academicStandard}").
       - Detailed Lesson Body: Break down key concepts with deep, thoughtful explanations.
       - ${comparisonInstruction}
       - ${caseStudyInstruction}
       - Active Learning: Conclude with a thorough summary and 3 high-quality "Quick Check" review questions.
    
    [IF PROVIDED] RELEVANT COURSE CONTEXT/OUTLINE TO FOLLOW: 
    ${sourceContext || `General academic standards for this level calibrated to ${academicStandard}.`}
    
    Course: ${courseName}
    Module: ${moduleTitle}
    Lesson: ${lessonTitle}
    Academic Standard: ${academicStandard}
    Tone: ${tone}
    Depth: ${depth}
    Level: ${level || 'University Undergraduate'}
    Department: ${targetDept}
    
    Requirements:
    1. Write in DETAILED Markdown format. Do NOT hold back on length; make it as thorough as a university lecture transcript.
    2. Target length: 1200-2000+ words. Focus on core concepts, deep-dive qualitative explanations, structured study notes, case studies, and practical examples strictly within ${targetDept}.
    3. Use a professional, academic tone suitable for a top-tier university, adapted to the requested Tone: ${tone} and Academic Standard: ${academicStandard}.
    4. Ensure all concepts are explained clearly and logically, using step-by-step breakdowns and multiple real-world examples to ensure deep understanding.
    5. Prioritize qualitative descriptions, conceptual definitions, and highly descriptive explanatory text. Avoid over-cluttering the lesson notes with unnecessary or excessive mathematical formulas, unless the topic is specifically and strictly quantitative or mathematical. For general science or humanities topics, balance mathematical equations with detailed qualitative "why" and "how" study notes.
    6. Use LaTeX only where absolutely necessary for core mathematical equations, variables, or scientific notation, and make sure every formula is accompanied by full text-based explanation.
    
    CRITICAL LATEX & CLEAN FORMATTING SAFETY INSTRUCTIONS:
    1. You MUST use LaTeX for ALL mathematical formulas, variables, and equations.
    2. Use $ ... $ for inline math and $$ ... $$ for block math.
    3. Ensure absolute compatibility with mathematical notation ($ ... $ and $$ ... $$) and clean Markdown so that complex formulas render seamlessly in the layout. Always verify that all inline $ and block $$ delimiters are perfectly closed and balanced to prevent rendering issues or broken containers.
    4. You are outputting data to a JSON parser. You MUST double-escape all LaTeX backslashes. 
       For example, output \\\\frac instead of \\frac, and \\\\begin instead of \\begin.
    5. Do NOT use \\label{...} as it is not supported. Use \\tag{...} for equation numbering if needed.
    6. Ensure all LaTeX environments (like align, matrix, etc.) are wrapped in $$ ... $$ delimiters.
    7. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    
    6. CRITICAL: Output ONLY valid JSON matching this structure:
    {
      "content": "The raw markdown content including Introduction, Learning Objectives, Key Vocabulary, Body, Summary, and Quick Check questions...",
      "metadata": {
        "hasMath": boolean,
        "hasCode": boolean
      }
    }
    CRITICAL: Do NOT wrap the JSON in markdown blocks. Output raw JSON only.
    CRITICAL: Ensure all double quotes inside the "content" string are properly escaped (e.g., \\"word\\").
    7. CRITICAL: Ensure the lesson is COMPLETE and does not cut off abruptly.
    8. CRITICAL: Calibrate the depth and complexity to the student's level (${level || 'University Level'}), academic standard (${academicStandard}), and requested Depth: ${depth}.
  `;

  const result = await callGenerateAPI(lessonPrompt, 'lesson', provider);

  const sanitizedContent = sanitizeLatex(result.content);

  // Post-generation off-topic drift check
  const driftCheck = flagOffTopicDrift(sanitizedContent, courseName, targetDept);
  if (driftCheck.hasDrift) {
    console.warn(`[AI Course Generator] Potential off-topic drift detected in lesson "${lessonTitle}" for course "${courseName}" (${targetDept}):`, driftCheck.hits);
  }

  const cleanMetadata: PipelineMetadata = {
    hasMath: Boolean(result?.metadata?.hasMath),
    hasCode: Boolean(result?.metadata?.hasCode),
    ...(result?.metadata && typeof result.metadata === 'object' ? sanitizeForFirestore(result.metadata) : {})
  };

  return {
    title: lessonTitle,
    content: sanitizedContent,
    metadata: cleanMetadata
  };
}

export async function generateModuleQuiz(
  courseName: string,
  moduleTitle: string,
  quizTopics: string[],
  provider?: string,
  level?: string,
  department?: string,
  academicStandard: string = 'Globally Adaptive (Universal University Standard)'
): Promise<any> {
  const quizPrompt = `
    Generate a university-level quiz for this module.
    
    CRITICAL: You MUST use the dynamic academic standard "${academicStandard}" to ensure the quiz is both exam-relevant and deeply educational, testing for world-class competency:
    1. Relevance: Questions must strictly align with the accredited academic standard "${academicStandard}" and its learning outcomes for ${department || 'this discipline'} at ${level || 'University Level'} to ensure comprehensive exam readiness and institutional rigor.
    2. Depth: Calibrated to "${academicStandard}", questions must be challenging, high-order, and conceptual (level 4-6 on Bloom's Taxonomy), requiring deep analytical thinking rather than rote memorization. Incorporate global best practices for standardized testing at top-tier universities worldwide.
    
    Course: ${courseName}
    Module: ${moduleTitle}
    Academic Standard: ${academicStandard}
    Topics: ${quizTopics.join(', ')}
    ${level ? `Level: ${level}` : ''}
    ${department ? `Department: ${department}` : ''}
    
    Requirements:
    1. Generate 8-12 challenging, high-quality multiple-choice questions.
    2. Questions must test deep conceptual understanding and application of knowledge, avoiding simple rote memorization.
    3. Include a mix of difficulty levels: 20% foundational, 50% intermediate, 30% advanced/analytical.
    4. CRITICAL: Calibrate the difficulty to the student's level (${level || 'University Level'}) and academic standard (${academicStandard}).
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
    6. Double check that every backslash in your LaTeX is escaped with another backslash (e.g., \\\\alpha, \\\\beta).
    9. CRITICAL: For LaTeX in JSON strings, use double backslashes (e.g., "\\\\mathbf"). Do NOT use triple backslashes.
    10. CRITICAL: Ensure the quiz meets world-class academic standards set by "${academicStandard}" and adaptive assessment frameworks.
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
  
  // Sanitize LaTeX in questions and explanations and auto-heal options
  if (result && result.questions && Array.isArray(result.questions)) {
    result.questions = result.questions.map((q: any) => {
      if (!q || typeof q !== 'object') return q;
      const sanitized = {
        ...q,
        question: sanitizeLatex(q.question),
        options: Array.isArray(q.options) ? q.options.map((opt: any) => sanitizeLatex(opt)) : q.options,
        explanation: sanitizeLatex(q.explanation),
        hint: sanitizeLatex(q.hint)
      };
      return autoHealQuestion(sanitized);
    });
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
  sourceContext?: string,
  academicStandard: string = 'Globally Adaptive (Universal University Standard)',
  level?: string,
  department?: string
): Promise<any> {
  if (onProgress) onProgress(`Generating Module: ${moduleSkeleton.title}...`);

  const lessons = [];
  for (const lessonTitle of moduleSkeleton.lessonTitles) {
    if (checkCancelled && checkCancelled()) throw new Error('Generation cancelled by user.');
    if (onProgress) onProgress(`Generating Lesson: ${lessonTitle}...`);
    const lesson = await generateLessonContent(courseName, moduleSkeleton.title, lessonTitle, provider, level, department, tone, depth, sourceContext, academicStandard);
    lessons.push(lesson);
  }

  if (checkCancelled && checkCancelled()) throw new Error('Generation cancelled by user.');
  if (onProgress) onProgress(`Generating Quiz for: ${moduleSkeleton.title}...`);
  const quiz = await generateModuleQuiz(courseName, moduleSkeleton.title, moduleSkeleton.quizTopics, provider, level, department, academicStandard);

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
  sourceContext?: string,
  academicStandard: string = 'Globally Adaptive (Universal University Standard)',
  level?: string,
  department?: string
): Promise<GeneratedCourse> {
  
  if (onProgress) onProgress(10, "Generating course skeleton...");

  const skeleton = await generateCourseSkeleton(courseName, courseDescription, outline, provider, [], level, undefined, department, undefined, tone, depth, sourceContext, academicStandard);
  
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
        const moduleContent = await generateModuleContent(courseName, moduleSkeleton, provider, undefined, () => false, tone, depth, sourceContext, academicStandard, level, department);
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
