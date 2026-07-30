const text = `**Inductive step (\\(n=k+1\\))** \\[ \\begin{aligned} \\sum_{i=1}^{k+1} i &= \\left(\\sum_{i=1}^{k} i\\right) + (k+1) \\\\ &= \\frac{k(k+1)}{2} + (k+1) \\quad\\text{[by the hypothesis]}\\\\[4pt] &= \\frac{k(k+1)+2(k+1)}{2} \\\\ &= \\frac{(k+1)(k+2)}{2}. \\end{aligned} \\] This is exactly`;
console.log(text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`));
