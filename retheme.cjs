const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace emerald with indigo
    content = content.replace(/emerald-/g, 'indigo-');
    // Replace some instances of green that were used as variants (e.g. green-50)
    content = content.replace(/green-/g, 'blue-');
    
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

// Update index.css
const indexCssPath = path.join(__dirname, 'src/index.css');
let cssContent = fs.readFileSync(indexCssPath, 'utf8');
cssContent = cssContent.replace(/142 76% 36%/g, '224 76% 48%');
fs.writeFileSync(indexCssPath, cssContent, 'utf8');
console.log('Updated index.css');
