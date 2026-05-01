import fetch from 'node-fetch';

async function run() {
  const payload = {
    prompt: `
    Generate a quiz for the entire module: "Introduction To Biology". 
    The content for this module includes the following subtopics and their detailed content:
          
    Student Name: Student
    Student Level: University Level
    Department: General Academic
    Number of questions: 5.
    Question type: multiple-choice.
    Ensure questions are technically accurate and mathematically rigorous for the given subject.
    CRITICAL: Calibrate the difficulty and complexity to the student's level.
    Return the response as a VALID JSON object containing a "questions" array.
    CRITICAL: Every property name MUST be double-quoted. Do not use unquoted keys.
    Structure:
    {
      "questions": [
        {
          "id": "string",
          "type": "multiple-choice",
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string",
          "hint": "string",
          "difficulty": 3
        }
      ]
    }`,
    responseFormat: 'json',
    taskType: 'quiz'
  };

  const res = await fetch('http://localhost:3000/api/ai/test-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(data);
}

run();
