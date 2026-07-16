function isRunaway(mathContent) {
  // Strip \text{...} and \mathrm{...}
  let stripped = mathContent.replace(/\\(text|mathrm|textbf|textit)\{.*?\}/g, '');
  // Count words that are at least 3 letters long and not preceded by \
  let words = stripped.match(/(?<!\\)[a-zA-Z]{3,}/g) || [];
  return words.length >= 3;
}

console.log(isRunaway("E\\ is the magnitude of the electric field")); // true
console.log(isRunaway("a + b = c + d")); // false
console.log(isRunaway("\\int_{0}^{\\infty} f(x) dx")); // false
console.log(isRunaway("x \\text{ is an integer } y")); // false
console.log(isRunaway("area A\\ separated by a distance")); // true
console.log(isRunaway("V_{in}")); // false
console.log(isRunaway("\\sin(x) + \\cos(y)")); // false
console.log(isRunaway("E_{max} = 100")); // false
