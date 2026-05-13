const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src', 'games');
const exclude = ['index.ts', 'index.ts.backup', 'PlaceholderGame.tsx'];

const gameDirs = fs.readdirSync(gamesDir).filter(file => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory() && !exclude.includes(file);
});

const exportStatements = [];
const mapEntries = [];

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
    
    // 生成映射条目 - 游戏ID应该是首字母小写的组件名
    let gameId = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    
    // 处理一些特殊情况
    const specialMappings = {
      'BasketballShootGame': 'basketballshoot',
      'ForestAdventureGame': 'forestadventure',
      'HelicopterEscapeGame': 'helicopterescape',
      'IslandSurvivalGame': 'islandsurvival',
      'MountainClimberGame': 'mountainclimber',
      'PenaltyKickGame': 'penaltykick',
      'ZombieSurvivalGame': 'zombiesurvival'
    };
    
    if (specialMappings[componentName]) {
      gameId = specialMappings[componentName];
    }
    
    mapEntries.push(`'${gameId}': '${componentName}'`);
  }
});

// 添加占位游戏
exportStatements.push('export { default as PlaceholderGame } from \'./PlaceholderGame\';');

const indexContent = `// 自动生成的游戏索引文件\n${exportStatements.join('\n')}\n`;
fs.writeFileSync(path.join(gamesDir, 'index.ts'), indexContent);

// 更新 Game.tsx 中的 GAME_COMPONENT_MAP
const gameTsxPath = path.join(__dirname, 'src', 'pages', 'Game.tsx');
let gameTsxContent = fs.readFileSync(gameTsxPath, 'utf-8');

const mapContent = `const GAME_COMPONENT_MAP: Record<string, string> = {
  ${mapEntries.join(',\n  ')}
};`;

// 替换 GAME_COMPONENT_MAP
const mapStart = gameTsxContent.indexOf('const GAME_COMPONENT_MAP:');
const mapEnd = gameTsxContent.indexOf('};', mapStart) + 2;

if (mapStart !== -1) {
  gameTsxContent = gameTsxContent.substring(0, mapStart) + mapContent + gameTsxContent.substring(mapEnd);
  fs.writeFileSync(gameTsxPath, gameTsxContent);
  console.log(`✅ 成功更新游戏映射！`);
}

console.log(`✅ 成功生成游戏索引，包含 ${exportStatements.length - 1} 个游戏！`);
console.log(`✅ 已保存到: src/games/index.ts 和 src/pages/Game.tsx`);
