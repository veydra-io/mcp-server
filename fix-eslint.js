const fs = require('fs');
const path = require('path');

// Function to fix common ESLint issues
function fixESLintIssues(filePath) {
    console.log(`Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 1: Replace == with === and != with !==
    const beforeEq = content;
    content = content.replace(/([^=!])(\s*)(==)(\s*)([^=])/g, '$1$2===$4$5');
    content = content.replace(/([^=!])(\s*)(!=)(\s*)([^=])/g, '$1$2!==$4$5');
    if (content !== beforeEq) {
        modified = true;
        console.log(`  Fixed equality operators in ${filePath}`);
    }
    
    // Fix 2: Add rel="noreferrer" to target="_blank" links
    const beforeTarget = content;
    content = content.replace(/(<a[^>]*target=["']_blank["'][^>]*)(>)/g, (match, p1, p2) => {
        if (!p1.includes('rel=')) {
            return p1 + ' rel="noreferrer"' + p2;
        }
        return match;
    });
    if (content !== beforeTarget) {
        modified = true;
        console.log(`  Fixed target="_blank" links in ${filePath}`);
    }
    
    // Fix 3: Add return statements to map functions that don't return
    const beforeMap = content;
    content = content.replace(/\.map\(\s*\([^)]*\)\s*=>\s*\{([^}]*)\}\s*\)/g, (match, body) => {
        // Check if the body already has a return statement
        if (!body.includes('return ') && body.trim() !== '') {
            // Add return statement
            const trimmedBody = body.trim();
            return match.replace(body, `\n        return ${trimmedBody};\n      `);
        }
        return match;
    });
    if (content !== beforeMap) {
        modified = true;
        console.log(`  Fixed map function returns in ${filePath}`);
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`  ✓ Successfully updated ${filePath}`);
        return true;
    } else {
        console.log(`  - No changes needed for ${filePath}`);
        return false;
    }
}

// Function to recursively find JS/JSX files
function findJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
            findJSFiles(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
const srcDir = path.join(__dirname, 'frontend', 'src');
if (!fs.existsSync(srcDir)) {
    console.error('Frontend src directory not found!');
    process.exit(1);
}

console.log('Finding JavaScript files...');
const jsFiles = findJSFiles(srcDir);
console.log(`Found ${jsFiles.length} JavaScript files`);

let modifiedCount = 0;
jsFiles.forEach(file => {
    if (fixESLintIssues(file)) {
        modifiedCount++;
    }
});

console.log(`\n✓ Fixed ${modifiedCount} files`);
console.log('Run "npm run build" to check remaining issues');
