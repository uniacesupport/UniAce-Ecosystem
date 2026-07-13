let inner = "A\\";
if (inner.endsWith('\\') && !inner.endsWith('\\\\')) {
  inner = inner.slice(0, -1);
}
console.log(inner);

inner = "A\\\\";
if (inner.endsWith('\\') && !inner.endsWith('\\\\')) {
  inner = inner.slice(0, -1);
}
console.log(inner);
