let sanitized = "The electric flux $$ \\Phi_E$through a surface is given by the dot product of the electric field$$ \\vec{E}$and the area vector$$ \\vec{A}$";

sanitized = sanitized.replace(/([^\n])\$\$/g, '$1\n$$$$');
sanitized = sanitized.replace(/\$\$([^\n])/g, '$$$$\n$1');
console.log(JSON.stringify(sanitized));
