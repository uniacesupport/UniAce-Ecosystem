const mathKeywords = [
        'cup', 'cap', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin', 
        'setminus', 'emptyset', 'varnothing', 'infty', 'forall', 'exists', 
        'implies', 'iff', 'to', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 
        'approx', 'times', 'pm', 'div', 'cdot', 'alpha', 'beta', 'gamma', 
        'delta', 'theta', 'omega', 'pi', 'sigma', 'mu', 'lambda', 'tau', 
        'phi', 'psi', 'varepsilon', 'varphi', 'limits', 'tag', 'vec', 'hat'
];

let text = "resulting in a higher capacitance";

let fixed = text;
for (const kw of mathKeywords) {
  const regex = new RegExp(`(?<!\\\\)\\b${kw}\\b`, 'g');
  fixed = fixed.replace(regex, `\\${kw}`);
}
console.log(fixed);
