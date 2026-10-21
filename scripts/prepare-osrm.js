#!/usr/bin/env node

/**
 * OpenStreetMap (.osm.pbf) -> OSRM Preprocessing Script (MLD Pipeline)
 * Usage: node scripts/prepare-osrm.js <path-to-pbf> [output-dir]
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const pbfPath = process.argv[2];
const outputDir = process.argv[3] || './data/osrm';

if (!pbfPath) {
  console.log(`
[EquipNav OSRM Preprocessor]
사용법: node scripts/prepare-osrm.js <pbf파일경로> [출력디렉토리]
예시: node scripts/prepare-osrm.js ./data/korea-latest.osm.pbf ./data/osrm
  `);
  process.exit(1);
}

if (!fs.existsSync(pbfPath)) {
  console.error(`[오류] 지정한 PBF 파일이 존재하지 않습니다: ${pbfPath}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// OSRM binaries path inside node_modules
const osrmBindingDir = path.resolve('./node_modules/@project-osrm/osrm/lib/binding');
const carProfile = path.resolve('./node_modules/@project-osrm/osrm/profiles/car.lua');

const isWin = process.platform === 'win32';
const ext = isWin ? '.exe' : '';

const extractBin = path.join(osrmBindingDir, `osrm-extract${ext}`);
const partitionBin = path.join(osrmBindingDir, `osrm-partition${ext}`);
const customizeBin = path.join(osrmBindingDir, `osrm-customize${ext}`);

const baseName = path.basename(pbfPath, '.pbf');
const targetOsrmFile = path.join(outputDir, `${baseName}.osrm`);

console.log(`=== OSRM 자동차 도로망 전처리 시작 (MLD) ===`);
console.log(`입력 파일: ${pbfPath}`);
console.log(`출력 파일: ${targetOsrmFile}`);

function runCommand(bin, args) {
  console.log(`\n> 실행: ${path.basename(bin)} ${args.join(' ')}`);
  const res = spawnSync(bin, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`[오류] 명령 실행 실패 (${path.basename(bin)})`);
    process.exit(1);
  }
}

// Copy pbf to target directory if needed
const destPbf = path.join(outputDir, path.basename(pbfPath));
if (path.resolve(pbfPath) !== path.resolve(destPbf)) {
  fs.copyFileSync(pbfPath, destPbf);
}

// 1. Extract
runCommand(extractBin, ['-p', carProfile, destPbf]);

// 2. Partition
runCommand(partitionBin, [targetOsrmFile]);

// 3. Customize
runCommand(customizeBin, [targetOsrmFile]);

console.log(`\n=== OSRM 전처리 완료! ===`);
console.log(`생성된 OSRM 데이터셋: ${targetOsrmFile}`);
