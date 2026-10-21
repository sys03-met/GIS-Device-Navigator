#!/usr/bin/env node
/**
 * OSRM Korea OSM Data Preprocessing Guide & Script
 *
 * Instructions for preparing offline OSRM road dataset for South Korea:
 * 1. Download South Korea OSM PBF:
 *    wget https://download.geofabrik.de/asia/south-korea-latest.osm.pbf -O data/korea-latest.osm.pbf
 * 2. Preprocess with OSRM MLD algorithm:
 *    osrm-extract -p profiles/car.lua data/korea-latest.osm.pbf
 *    osrm-partition data/korea-latest.osrm
 *    osrm-customize data/korea-latest.osrm
 * 3. Place generated `.osrm*` dataset files in `data/osrm/` folder.
 */

const fs = require('fs');
const path = require('path');

const osrmDataDir = path.join(__dirname, '..', 'data', 'osrm');
if (!fs.existsSync(osrmDataDir)) {
  fs.mkdirSync(osrmDataDir, { recursive: true });
}

console.log('=== EquipNav OSRM Dataset Preprocessing Directory Prepared ===');
console.log(`Target directory: ${osrmDataDir}`);
console.log('Place `korea.osrm` and associated MLD dataset files into this directory.');
