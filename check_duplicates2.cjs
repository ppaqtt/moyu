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
const startLine = content.substring(0, gamesListStart).split('\n').length;

// 提取所有游戏定义
const lines = gamesListContent.split('\n');
const gameIds = [];
const idLocations = {};

lines.forEach((line, index) => {
  const match = line.match(/{\s*id:\s*'([^']*)'/);
  if (match) {
    const id = match[1];
    gameIds.push(id);
    if (!idLocations[id]) {
      idLocations[id] = [];
    }
    idLocations[id].push(startLine + index);
  }
});

console.log(`Total games: ${gameIds.length}`);
console.log(`Unique IDs: ${Object.keys(idLocations).length}`);

console.log('\nDuplicate IDs:');
const duplicates = Object.entries(idLocations).filter(([id, locations]) => locations.length > 1);
if (duplicates.length === 0) {
  console.log('No duplicates found!');
} else {
  duplicates.forEach(([id, locations]) => {
    console.log(`- ${id}: ${locations.length} times at lines ${locations.join(', ')}`);
  });
}
