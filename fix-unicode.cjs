const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all \uXXXX escape sequences with actual Unicode characters
content = content.replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
  return String.fromCharCode(parseInt(hex, 16));
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Unicode escapes -> actual Chinese characters');

// Verify: count remaining \u sequences
const remaining = (content.match(/\\u[0-9A-Fa-f]{4}/g) || []).length;
console.log('Remaining \\uXXXX sequences:', remaining);
