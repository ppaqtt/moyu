
const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.ts');
const content = fs.readFileSync(constantsPath, 'utf8');

// 找到 GAMES_LIST 的完整定义
const startMarker = 'export const GAMES_LIST: Game[] = [';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
  console.error('❌ 未找到 GAMES_LIST');
  process.exit(1);
}

// 找到匹配的 ] 结束标记
let bracketCount = 0;
let endIndex = -1;

for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '[') bracketCount++;
  if (content[i] === ']') {
    bracketCount--;
    if (bracketCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
}

if (endIndex === -1) {
  console.error('❌ 未找到 GAMES_LIST 的结束标记');
  process.exit(1);
}

const gamesListContent = content.substring(startIndex, endIndex);
const lines = gamesListContent.split('\n');

console.log(`✅ 已找到 GAMES_LIST，共 ${lines.length} 行\n`);

const idMap = new Map(); // id -> [{line, content}]

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/id:\s*['"]([^'"]+)['"]/);
  
  if (match) {
    const id = match[1];
    if (!idMap.has(id)) {
      idMap.set(id, []);
    }
    idMap.get(id).push({
      line: i + 1,
      content: line.trim()
    });
  }
}

console.log('🔍 查找重复 ID:\n');
const duplicates = [];

for (const [id, entries] of idMap.entries()) {
  if (entries.length > 1) {
    duplicates.push({ id, entries });
  }
}

if (duplicates.length === 0) {
  console.log('✅ 未发现重复的游戏 ID！');
} else {
  console.log(`❌ 发现 ${duplicates.length} 个重复的游戏 ID:\n`);
  
  duplicates.forEach(({ id, entries }) => {
    console.log(`ID: ${id} (出现 ${entries.length} 次)`);
    entries.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. 第 ${entry.line} 行: ${entry.content}`);
    });
    console.log('');
  });
}

console.log('\n📊 统计:');
console.log(`- 总游戏数: ${idMap.size}`);
console.log(`- 无重复: ${idMap.size - duplicates.length}`);
console.log(`- 有重复: ${duplicates.length}`);
