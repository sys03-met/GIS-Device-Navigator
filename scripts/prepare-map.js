#!/usr/bin/env node

/**
 * PMTiles Offline Map Preparation Guide
 */

console.log(`
===========================================================
 EquipNav 대한민국 오프라인 지도 (PMTiles) 준비 가이드
===========================================================

1. OpenStreetMap (OSM) 대한민국 데이터 다운로드:
   - Geofabrik: https://download.geofabrik.de/asia/south-korea-latest.osm.pbf

2. PMTiles 지도 타일 파일 생성 도구 (planetiler 또는 tilemaker):
   - Planetiler 사용 예시:
     java -Xmx4g -jar planetiler.jar --download --area=south-korea --output=korea.pmtiles

3. 생성된 PMTiles 파일을 배포 폴더의 data/ 디렉토리에 복사:
   - 파일 위치: data/korea.pmtiles

4. 서버 가동 시 /api/v1/map/tiles/korea.pmtiles 엔드포인트를 통해
   MapLibre GL JS 타일로 오프라인 연결됩니다.
===========================================================
`);
