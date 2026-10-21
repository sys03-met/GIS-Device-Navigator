const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== EquipNav Windows Portable Release Builder ===\n');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist-portable', 'EquipNav');

// 1. Clean and Create Portable Directory Structure
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

const folders = [
  'node',
  'server/dist',
  'server/node_modules',
  'web/dist',
  'data/osrm',
  'assets/fonts',
  'assets/sprites',
  'logs'
];

folders.forEach(f => fs.mkdirSync(path.join(distDir, f), { recursive: true }));

// 2. Bundle Node.js Executable if available in environment
const systemNodeExe = process.execPath;
if (systemNodeExe && fs.existsSync(systemNodeExe)) {
  console.log(`[0/4] Bundling Node.js runtime executable from ${systemNodeExe}...`);
  fs.copyFileSync(systemNodeExe, path.join(distDir, 'node', 'node.exe'));
} else {
  console.warn('[WARN] System node.exe not found. Please manually place node.exe into `dist-portable/EquipNav/node/`.');
}

// 3. Build Monorepo Workspaces
console.log('[1/4] Building monorepo packages (contracts, server, web)...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 4. Copy Server Dist & Node Modules
console.log('[2/4] Copying compiled artifacts to portable layout...');
fs.cpSync(path.join(rootDir, 'apps', 'server', 'dist'), path.join(distDir, 'server', 'dist'), { recursive: true });
fs.cpSync(path.join(rootDir, 'apps', 'web', 'dist'), path.join(distDir, 'web', 'dist'), { recursive: true });

// 5. Copy Control Scripts & Config
console.log('[3/4] Copying scripts and default configurations...');
['start.bat', 'stop.bat', 'config.json'].forEach(file => {
  if (fs.existsSync(path.join(rootDir, file))) {
    fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  }
});

console.log('\n[SUCCESS] Portable deployment build complete!');
console.log(`Portable release package directory: ${distDir}`);
