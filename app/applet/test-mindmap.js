const chart = `mindmap
  root((mindmap))
    Origins
      Popularisation
        British popular psychology author Tony Buzan
`;

let sanitized = chart;
if (sanitized.includes('mindmap')) {
    const lines = sanitized.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0) {
        processedLines.push(line);
        continue;
      }
      
      const indentMatch = line.match(/^(\s+)(.+)$/);
      if (indentMatch) {
        const indent = indentMatch[1];
        let content = indentMatch[2].trim();
        
        // Fix: If AI put multiple nodes on one line like "Node 1" "Node 2"
        if (content.match(/"[^"]+"\s+"[^"]+"/)) {
          const parts = content.match(/"[^"]+"/g);
          if (parts) {
            parts.forEach(part => processedLines.push(indent + part));
            continue;
          }
        }

        // If it's not already quoted or in parentheses/brackets, and contains spaces or special chars
        if (!content.startsWith('"') && 
            !content.startsWith('(') && 
            !content.startsWith('[') && 
            !content.startsWith('{') &&
            (content.includes(' ') || content.includes('(') || content.includes(')'))) {
          
          // Handle cases where AI put parentheses inside but not around the whole thing
          content = `"${content.replace(/"/g, "'")}"`;
        }
        processedLines.push(`${indent}${content}`);
      } else {
        processedLines.push(line);
      }
    }
    sanitized = processedLines.join('\n');
}
console.log(sanitized);
