#!/usr/bin/env node

/**
 * Windows Portable Package Builder for EquipNav
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const distDir = path.resolve('./dist_portable/EquipNav');

console.log('=== EquipNav Windows 포터블 배포본 빌드 시작 ===');

// 1. Build all packages
console.log('1. Monorepo 프로젝트 전체 빌드 중...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Re-create target folder
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Helper to copy recursively handling symlinks/directories
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyDirSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 3. Copy Server Dist & Web Dist
console.log('2. 서버 및 웹 애플리케이션 빌드 결과물 복사 중...');
copyDirSync('./apps/server/dist', path.join(distDir, 'server/dist'));
copyDirSync('./apps/web/dist', path.join(distDir, 'web/dist'));
copyDirSync('./packages/contracts/dist', path.join(distDir, 'packages/contracts/dist'));

// 4. Copy node_modules required for runtime (including OSRM Native Binding)
console.log('3. 런타임 및 네이티브 모듈(OSRM, SQLite) 복사 중...');
copyDirSync('./node_modules', path.join(distDir, 'node_modules'));

// 5. Node.js Embedded Binary Structure
console.log('4. Node.js 런타임 폴더 구조 생성...');
fs.mkdirSync(path.join(distDir, 'node'), { recursive: true });

// 6. Data & Config
console.log('5. Data 디렉토리 및 config.json 생성...');
fs.mkdirSync(path.join(distDir, 'data/osrm'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'logs'), { recursive: true });

const defaultConfig = {
  mode: 'local',
  port: 8080,
  host: '127.0.0.1',
  dataDir: './data',
  dbPath: './data/equipment.db',
  osrmPath: './data/osrm/korea-car.osrm',
};

fs.writeFileSync(path.join(distDir, 'config.json'), JSON.stringify(defaultConfig, null, 2));

// 7. Windows Batch Scripts (start.bat / stop.bat)
console.log('6. Windows start.bat 및 stop.bat 가동 스크립트 작성 중...');

const startBat = `@echo off
chcp 65001 > NUL
title EquipNav - 오프라인 설비 지도 및 방문 경로 관리 시스템

echo ===========================================================
echo  EquipNav 시스템을 가동합니다.
echo ===========================================================

set PATH=%CD%\\node;%PATH%

if not exist node\\node.exe (
    where node >nul 2>nul
    if errorlevel 1 (
        echo [오류] node\\node.exe 파일 및 시스템 Node.js를 찾을 수 없습니다.
        pause
        exit /b 1
    )
)

start /b "" node server\\dist\\server.js > logs\\app.log 2>&1

echo.
echo 서버가 성공적으로 가동되었습니다!
echo 브라우저를 열고 http://localhost:8080 로 접속하세요.
echo.
pause
`;

const stopBat = `@echo off
chcp 65001 > NUL
title EquipNav 종료

echo EquipNav 프로세스를 종료합니다...
taskkill /f /im node.exe >nul 2>&1

echo 종료되었습니다.
pause
`;

fs.writeFileSync(path.join(distDir, 'start.bat'), startBat);
fs.writeFileSync(path.join(distDir, 'stop.bat'), stopBat);

console.log('\n=== EquipNav Windows 포터블 배포본 생성 완료! ===');
console.log(`배포 폴더 경로: ${distDir}`);
