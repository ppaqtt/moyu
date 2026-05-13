const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src', 'games');
const exclude = ['index.ts', 'index.ts.backup', 'PlaceholderGame.tsx'];

const gameDirs = fs.readdirSync(gamesDir).filter(file => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory() && !exclude.includes(file);
});

const exportStatements = [];

gameDirs.forEach(dir => {
  // 检查目录下的主要文件
  const tsxFiles = fs.readdirSync(path.join(gamesDir, dir)).filter(f => f.endsWith('.tsx'));
  let componentName = '';
  
  if (tsxFiles.length > 0) {
    // 尝试找与目录名相同的文件
    const match = tsxFiles.find(f => f.replace('.tsx', '') === dir);
    if (match) {
      componentName = dir;
    } else {
      // 否则使用第一个文件
      componentName = tsxFiles[0].replace('.tsx', '');
    }
    
    // 生成导出语句
    exportStatements.push(`export { default as ${componentName} } from './${dir}/${componentName}';`);
  }
});

// 添加占位游戏
exportStatements.push('export { default as PlaceholderGame } from \'./PlaceholderGame\';');

const indexContent = `// 自动生成的游戏索引文件\n${exportStatements.join('\n')}\n`;

fs.writeFileSync(path.join(gamesDir, 'index.ts'), indexContent);
console.log(`✅ 成功生成游戏索引，包含 ${exportStatements.length - 1} 个游戏！`);
console.log(`✅ 已保存到: src/games/index.ts`);
