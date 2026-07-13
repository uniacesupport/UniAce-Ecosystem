const chart = `flowchart TD
    A["Early Explorations (Pre-1900)"] --> B["Da Vinci's Designs"]
    C[Simple Node] --> D[(Database)]
    E((Circle)) --> F{Decision}
    G[Node with (parens)] --> H[Node with [brackets]]
`;

let sanitized = chart;
sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)([\(\[\{>]+)(.*?)([\)\]\}]+)/g, (match, id, bracketIn, text, bracketOut) => {
    console.log({match, id, bracketIn, text, bracketOut});
    return match;
});
