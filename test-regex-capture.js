let str = "\n\\[ x \\]";
str = str.replace(/(?<!\$)\n\s*\\\[/g, '\n$$$$\n$1');
str = str.replace(/\\\]\s*\n(?!\$)/g, '$1\n$$$$\n');
console.log(JSON.stringify(str));
