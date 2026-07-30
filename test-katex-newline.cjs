import { renderToString } from 'katex';
try {
  console.log(renderToString("\\begin{aligned} x=1 \\end{aligned}", { displayMode: true }));
  console.log("Success");
} catch(e) {
  console.log("Fail", e.message);
}
