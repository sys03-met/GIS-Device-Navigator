# EquipNav API Reference Manual

## Health & System Status
- `GET /api/v1/health` : 서버 상태 및 라우팅 엔진 동작 정보 조회
- `GET /api/v1/system/status` : 운영 모드 (`local` / `lan`) 및 설정 정보 조회

## Equipment Management API
- `GET /api/v1/equipment` : 전체 설비 목록 조회 및 필터링 (`query`, `equipment_type`, `status`, `bbox`)
- `GET /api/v1/equipment/:id` : 단일 설비 상세 정보 조회
- `POST /api/v1/equipment` : 신규 설비 등록
- `PATCH /api/v1/equipment/:id` : 설비 정보 수정
- `DELETE /api/v1/equipment/:id` : 설비 삭제
- `POST /api/v1/equipment/import/csv` : CSV 데이터 대량 가져오기
- `GET /api/v1/equipment/export/csv` : 전체 설비 CSV 내보내기 다운로드

## Route Calculation & Spatial Analysis API
- `POST /api/v1/routes/calculate` : 출발지-목적지 자동차 도로 경로 계산 (거리, 시간, GeoJSON)
- `POST /api/v1/routes/nearby-equipment` : 실제 경로 선형 좌표 기준 주변 설비 이격거리 연산 및 필터링
- `POST /api/v1/routes/optimize` : 경유 설비 최적 방문 순서 계산 (OSRM Trip/Heuristic)

## Route Plan Management API
- `GET /api/v1/route-plans` : 저장된 방문 계획 목록 조회
- `POST /api/v1/route-plans` : 방문 계획 신규 저장
- `GET /api/v1/route-plans/:id` : 특정 방문 계획 상세 및 정거장 조회
- `DELETE /api/v1/route-plans/:id` : 방문 계획 삭제

## Offline Map Streaming API
- `GET /tiles/korea.pmtiles` : PMTiles 벡터 타일 HTTP Range Request 스트리밍
