let sanitized = "The electric flux $ \\Phi_E $ through a surface is given by the dot product of the electric field $ \\vec{E} $ and the area vector $ \\vec{A} $";

// Line 79
sanitized = sanitized.replace(/([^\n])\$\$/g, '$1\n$$$$');
sanitized = sanitized.replace(/\$\$([^\n])/g, '$$$$\n$1');

// Any other replacements in aiCourseGenerator.ts?
// Line 83
sanitized = sanitized.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

console.log(JSON.stringify(sanitized));
