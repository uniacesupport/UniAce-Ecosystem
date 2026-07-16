const mathKeywords = [
        'cup', 'cap', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 
        'setminus', 'emptyset', 'varnothing', 'infty', 'forall', 'exists', 
        'implies', 'iff', 'to', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 
        'approx', 'times', 'pm', 'div', 'cdot', 'alpha', 'beta', 'gamma', 
        'delta', 'theta', 'omega', 'pi', 'sigma', 'mu', 'lambda', 'tau', 
        'phi', 'psi', 'varepsilon', 'varphi', 'limits', 'tag', 'vec', 'hat'
];

let mathContent = "$E\\ is the magnitude of the electric field between the plates. The electric flux is directly proportional \\to the area of the plates and the electric field strength. By increasing the plate area or the electric field, the flux increases, resulting \\in a higher capacitance. This understanding is crucial \\in designing capacitors for specific applications, such as energy storage or filtering \\in electronic circuits. ### Summary: Electric flux and area vectors are essential concepts \\in understanding the behavior of electric fields. Electric flux quantifies the electric field passing through a surface, while area vectors describe the orientation and magnitude of the surface. The dot product of the electric field and area vector gives the electric flux, which is maximized when the field is perpendicular \\to the surface. Practical applications, such as \\in capacitor design, demonstrate the importance of these concepts \\in engineering and technology. ### Quick Check: 1. What is the physical interpretation of electric flux? How does it relate \\to the number of electric field lines passing through a surface? **Answer**: Electric flux represents the total number of electric field lines passing through a surface. It quantifies the amount of electric field penetrating the surface, with each field line contributing \\to the flux. 2. How does the angle between the electric field and the area vector affect the electric flux? **Answer**: The electric flux is maximum when the electric field is perpendicular \\to the surface (angle $";

let isBlock = false;
let inner = isBlock ? mathContent.slice(2, -2) : mathContent.slice(1, -1);
      
inner = inner.trim();
if (inner.endsWith('\\') && !inner.endsWith('\\\\')) {
  inner = inner.slice(0, -1);
}

let fixedInner = inner;

// Fix infinity -> infty
fixedInner = fixedInner.replace(/\\?infinity\b/gi, 'infty');

// Heuristic: If it looks like a runaway math block that consumed plain text, don't fix keywords
const stripped = fixedInner.replace(/\\(text|mathrm|textbf|textit)\{.*?\}/g, '');
const words = stripped.match(/(?<!\\)[a-zA-Z]{3,}/g) || [];
const isRunaway = words.length >= 3 && !isBlock;

if (!isRunaway) {
  // Fix unescaped keywords in math block
  for (const kw of mathKeywords) {
    const regex = new RegExp(`(?<!\\\\)\\b${kw}\\b`, 'g');
    fixedInner = fixedInner.replace(regex, `\\${kw}`);
  }
} else {
  // Un-escape incorrectly escaped english words that might be in the DB
  fixedInner = fixedInner.replace(/\\(in|to|cap|cup|times|pm|div|cdot|hat|vec)\b/gi, '$1');
  // Fix escaped spaces like E\ 
  fixedInner = fixedInner.replace(/\\\s/g, ' ');
  if (fixedInner.endsWith('\\')) fixedInner = fixedInner.slice(0, -1);
  console.log("Runaway detected. Resulting prose:");
  console.log(fixedInner);
}

