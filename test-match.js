let text = `where $
E\\
is the magnitude ... (angle $\\theta = 90^\\circ$)`;

console.log(text.match(/\$([^$\n]+?)\$/g));
