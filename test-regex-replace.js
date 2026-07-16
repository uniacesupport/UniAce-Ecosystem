let str = "**Electric Flux ( $$\\Phi_E$$ )**";
str = str.replace(/([^\n])\$\$/g, '$1\n$$$$');
console.log(JSON.stringify(str));
