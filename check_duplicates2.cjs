const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
const content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 数组
const gamesListStart = content.indexOf('export const GAMES_LIST: Game[] = [');
const gamesListEnd = content.indexOf('];', gamesListStart) + 2;
const gamesListContent = content.substring(gamesListStart, gamesListEnd);

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
    idLocations[id].push(gamesListStart + index + 1);
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
