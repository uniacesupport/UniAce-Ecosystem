let sanitized = String.raw`**Electric Flux ( $$\Phi_E$$ )**: A measure... area vector ($ \vec{A} $) of the surface:\n\n\Phi_E = \vec{E} \cdot \vec{A}$$- **Area Vector ($$$ \vec{A}$$)**: A vector...`;

sanitized = sanitized.replace(/([^\n])\$\$/g, '$1\n$$$$');
sanitized = sanitized.replace(/\$\$([^\n])/g, '$$$$\n$1');

console.log(sanitized);
