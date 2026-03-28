/**
 * Sanitizes and formats raw calculator UI input into strict mathematical syntax.
 * @param rawInput The raw string from the calculator display state.
 * @returns A parsed string ready for mathjs evaluation.
 */
export function sanitizeInput(rawInput: string): string {
    if (!rawInput || rawInput.trim() === '') return '0';

    let cleanStr = rawInput;

    // 1. Visual Math Symbols to Engine Functions
    // Roots
    cleanStr = cleanStr.replace(/√/g, 'sqrt');
    cleanStr = cleanStr.replace(/∛/g, 'cbrt');

    // Inverse Trigonometry
    cleanStr = cleanStr.replace(/sin⁻¹/g, 'asin');
    cleanStr = cleanStr.replace(/cos⁻¹/g, 'acos');
    cleanStr = cleanStr.replace(/tan⁻¹/g, 'atan');

    // Logarithms (Dialect Translation)
    // Note: Replace 'log' first, then 'ln' to avoid replacing 'log' inside 'log10'
    cleanStr = cleanStr.replace(/log/g, 'log10'); 
    cleanStr = cleanStr.replace(/ln/g, 'log');

    // Basic Operators
    cleanStr = cleanStr.replace(/×/g, '*');
    cleanStr = cleanStr.replace(/÷/g, '/');

    // 2. Map EXP to scientific notation (*10^)
    // If there is a number before EXP (e.g., '5EXP2'), map to '5*10^2'
    cleanStr = cleanStr.replace(/(\d)EXP/g, '$1*10^');
    // If EXP is at the beginning (e.g., 'EXP2'), assume a leading 1 ('1*10^2')
    cleanStr = cleanStr.replace(/(^|[^\d])EXP/g, '$11*10^');

    // 3. Fix dangling decimals (e.g., '0.' -> '0.0', 'log(0.' -> 'log(0.0')
    // Regex looks for a digit followed by a decimal, not followed by another digit
    cleanStr = cleanStr.replace(/(\d+\.)(?!\d)/g, '$10');

    // 4. Handle implicit multiplication (e.g., '5(2)' -> '5*(2)')
    cleanStr = cleanStr.replace(/(\d)(\()/g, '$1*$2');

    // 5. Auto-close unmatched parentheses (Solves 'asin(0.8' and '√(25')
    const openParens = (cleanStr.match(/\(/g) || []).length;
    const closeParens = (cleanStr.match(/\)/g) || []).length;
    
    if (openParens > closeParens) {
        cleanStr += ')'.repeat(openParens - closeParens);
    }

    return cleanStr;
}
