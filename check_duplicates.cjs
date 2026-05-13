const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
const content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 数组
const gamesListStart = content.indexOf('export const GAMES_LIST: Game[] = [');
const gamesListEnd = content.indexOf('];', gamesListStart) + 2;
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
