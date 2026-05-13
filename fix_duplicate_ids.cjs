
const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 数组
const gamesListStart = content.indexOf('export const GAMES_LIST: Game[] = [');
const gamesListEnd = content.indexOf('];', gamesListStart) + 2;
const gamesListContent = content.substring(gamesListStart, gamesListEnd);

// 提取所有游戏
const gameRegex = /\{[^}]*id:\s*'([^']*)'[^}]*\}/g;
let match;
const games = [];
const idCount = {};

while ((match = gameRegex.exec(gamesListContent)) !== null) {
  games.push(match[1]);
  idCount[match[1]] = (idCount[match[1]] || 0) + 1;
}

console.log('Found duplicate IDs:');
Object.entries(idCount).filter(([id, count]) => count > 1).forEach(([id, count]) => {
  console.log(`- ${id}: ${count} times`);
});

// 修复重复ID
const duplicates = new Set();
const fixedIds = new Set();

let updatedContent = content;
let fixedCount = 0;

// 对于每个重复的ID，给第二个之后的添加序号
const idOccurrences = {};

// 再次遍历，这次替换重复的
Object.keys(idCount).forEach(id => {
  if (idCount[id] > 1) {
    idOccurrences[id] = 0;
  }
});

// 手动替换已知的重复ID
// 我们将一些已知的重复ID修复
const replacements = {
  // factorytycoon 的第二个实例改为 industrialtycoon
  "id: 'factorytycoon', name: '工业大亨'": "id: 'industrialtycoon', name: '工业大亨'",
  
  // finddifferencepro 的第二个实例
  "id: 'finddifferencepro',": "id: 'finddifferencepro2',",
  
  // hiddenpicture 的第二个实例
  "id: 'hiddenpicture',": "id: 'hiddenpicture2',",
  
  // visiontrack 的第二个实例
  "id: 'visiontrack',": "id: 'visiontrack2',",
  
  // illusionart 的第二个实例
  "id: 'illusionart',": "id: 'illusionart2',",
};

let newContent = content;
let replacedCount = 0;

for (const [oldStr, newStr] of Object.entries(replacements)) {
  // 只替换第二个出现的
  let count = 0;
  newContent = newContent.split(oldStr).map((part, index) => {
    if (index > 0) {
      count++;
      if (count >= 2) { // 替换第二个及以后的
        replacedCount++;
        return newStr;
      }
    }
    return part;
  }).join(oldStr);
}

// 保存文件
fs.writeFileSync(constantsPath, newContent);
console.log(`\nFixed ${replacedCount} duplicate IDs!`);
console.log('Done!');
