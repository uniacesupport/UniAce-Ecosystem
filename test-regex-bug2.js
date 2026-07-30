const text = "A \\[ \\begin{aligned} \\sum &= 1 \\\\[4pt\\] &= 2 \\end{aligned} \\] B";
console.log(text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`));
