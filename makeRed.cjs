const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(/indigo-/g, 'red-');
    content = content.replace(/blue-/g, 'red-');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(path.join(__dirname, 'src'));

const indexCssPath = path.join(__dirname, 'src/index.css');
let cssContent = fs.readFileSync(indexCssPath, 'utf8');
// 224 76% 48% was indigo/primary. 0 72% 51% is a good red.
cssContent = cssContent.replace(/224 76% 48%/g, '0 72% 51%');
cssContent = cssContent.replace(/224\.3 76\.3% 48%/g, '0 72% 51%');
fs.writeFileSync(indexCssPath, cssContent, 'utf8');
console.log('Updated index.css');
