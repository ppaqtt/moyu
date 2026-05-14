const fs = require('fs');
const path = require('path');

const gamesDir = '/workspace/src/games';

function fixKeyboardListeners(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  let fixed = false;
  
  content = content.replace(
    /window\.addEventListener\(['"]keydown['"],\s*(\w+)\s*\)/g,
    (match, handler) => {
      fixed = true;
      return `window.addEventListener('keydown', ${handler}, true)`;
    }
  );
  
  content = content.replace(
    /window\.addEventListener\(['"]keyup['"],\s*(\w+)\s*\)/g,
    (match, handler) => {
      fixed = true;
      return `window.addEventListener('keyup', ${handler}, true)`;
    }
  );
  
  content = content.replace(
    /window\.removeEventListener\(['"]keydown['"],\s*(\w+)\s*\)/g,
    (match, handler) => {
      fixed = true;
      return `window.removeEventListener('keydown', ${handler}, true)`;
    }
  );
  
  content = content.replace(
    /window\.removeEventListener\(['"]keyup['"],\s*(\w+)\s*\)/g,
    (match, handler) => {
      fixed = true;
      return `window.removeEventListener('keyup', ${handler}, true)`;
    }
  );

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function scanDirectory(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      count += scanDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixKeyboardListeners(fullPath)) {
        count++;
      }
    }
  }
  
  return count;
}

console.log('Starting keyboard listener fix...');
const fixedCount = scanDirectory(gamesDir);
console.log(`Fixed ${fixedCount} files.`);