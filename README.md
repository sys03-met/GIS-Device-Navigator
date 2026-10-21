# EquipNav — 오프라인 설비 지도 및 방문 경로 관리 시스템

EquipNav는 인터넷 연결이 차단된 완전 오프라인 폐쇄망 환경에서도 대한민국 지도 위에 설비 위치를 표시하고, 출발지-목적지 간 자동차 라우팅 및 다중 설비 최적 방문 경로를 계산 및 관리하는 시스템입니다.

## 주요 기능
1. **완전 오프라인 실행**: 외부 CDN, 온라인 지도 API, 외부 라우팅 서버에 전혀 의존하지 않음
2. **PMTiles 벡터 지도 연동**: MapLibre GL JS와 HTTP Range Streaming 기반 오프라인 대한민국 지도 렌더링
3. **SQLite 설비 관리**: 설비 CRUD, CSV 가져오기/내보내기, 상태별 마커 및 클러스터링
4. **OSRM 자동차 경로 탐색**: OSRM 네이티브 바인딩 및 Geodesic Fallback 라우터 지원
5. **경로 주변 설비 공간 연산**: 실제 도로 선형 기반 이격거리 측정 및 주변 설비 조회
6. **경유지 최적화 및 방문 계획 저장**: OSRM Trip 알고리즘 기반 방문 순서 계산 및 계획 저장
7. **Windows 포터블 무설치 배포**: Node.js 런타임 및 DLL 포함 포터블 폴더 구성 (`start.bat`, `stop.bat`)

## 기술 스택
- **Frontend**: React, TypeScript, Vite, MapLibre GL JS, PMTiles
- **Backend**: Express, Node.js, TypeScript, SQLite (`better-sqlite3`), OSRM (`@project-osrm/osrm`), Turf.js
- **Contracts**: `@equipnav/contracts` (Zod, OpenAPI Schema DTO)

## 실행 방법
```bash
# 개발 모드 실행
npm install
npm run build
npm run dev:server
```

## 포터블 빌드 방법
```bash
node scripts/build-portable.js
```
생성된 `dist-portable/EquipNav` 폴더를 타겟 Windows PC에 복사한 후 `start.bat`을 실행합니다.
