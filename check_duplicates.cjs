const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
const content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 数组（兼容带或不带类型标注的声明）
const declarationIndex = content.indexOf('export const GAMES_LIST');
if (declarationIndex === -1) {
  console.error('未找到 GAMES_LIST');
  process.exit(1);
}
const gamesListStart = content.indexOf('[', content.indexOf('=', declarationIndex));
let bracketDepth = 0;
let gamesListEnd = -1;
for (let i = gamesListStart; i < content.length; i++) {
  if (content[i] === '[') bracketDepth++;
  else if (content[i] === ']') {
    bracketDepth--;
    if (bracketDepth === 0) {
      gamesListEnd = i + 1;
      break;
    }
  }
}
if (gamesListEnd === -1) {
  console.error('未找到 GAMES_LIST 的结束括号');
  process.exit(1);
}
const gamesListContent = content.substring(gamesListStart, gamesListEnd);

// 提取所有游戏ID
const idRegex = /{[^}]*id:\s*'([^']*)'[^}]*}/g;
let match;
const ids = [];
const idCount = {};

while ((match = idRegex.exec(gamesListContent)) !== null) {
  ids.push(match[1]);
  idCount[match[1]] = (idCount[match[1]] || 0) + 1;
}

console.log(`Total games: ${ids.length}`);
console.log(`Unique IDs: ${Object.keys(idCount).length}`);

console.log('\nDuplicate IDs:');
const duplicates = Object.entries(idCount).filter(([id, count]) => count > 1);
if (duplicates.length === 0) {
  console.log('No duplicates found!');
} else {
  duplicates.forEach(([id, count]) => {
    console.log(`- ${id}: ${count} times`);
  });
}
