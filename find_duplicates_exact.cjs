const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
const content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 数组
const gamesListStart = content.indexOf('export const GAMES_LIST: Game[] = [');
const gamesListEnd = content.indexOf('];', gamesListStart) + 2;

const contentBefore = content.substring(0, gamesListStart);
const gamesListContent = content.substring(gamesListStart, gamesListEnd);
const contentAfter = content.substring(gamesListEnd);

// 按行分割，统计 ID
const lines = gamesListContent.split('\n');
const idToLines = {};

let lineNumber = contentBefore.split('\n').length + 1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/{\s*id:\s*'([^']*)'/);
  if (match) {
    const id = match[1];
    if (!idToLines[id]) {
      idToLines[id] = [];
    }
    idToLines[id].push(lineNumber);
  }
  lineNumber++;
}

console.log('Duplicate game IDs:');
for (const [id, lines] of Object.entries(idToLines)) {
  if (lines.length > 1) {
    console.log(`- ${id}: appears at lines: ${lines.join(', ')}`);
  }
}

console.log('\nNow checking specific duplicates:', Object.entries(idToLines).filter(([id, lines]) => lines.length > 1).length);
