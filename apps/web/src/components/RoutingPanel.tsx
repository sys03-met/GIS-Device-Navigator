import React, { useState } from 'react';
import { MapPin, Navigation, Search, Trash2, ArrowUp, ArrowDown, Save, Sparkles, CheckCircle } from 'lucide-react';

interface Waypoint {
  id: string;
  name: string;
  coordinate: [number, number];
  equipment_id?: string;
}

interface RoutingPanelProps {
  origin: Waypoint | null;
  destination: Waypoint | null;
  waypoints: Waypoint[];
  setOrigin: (wp: Waypoint | null) => void;
  setDestination: (wp: Waypoint | null) => void;
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  onCalculateRoute: () => void;
  onOptimizeTrip: () => void;
  routeResult: any | null;
  nearbyEquipments: any[];
  onSearchNearby: (radiusMeters: number) => void;
  onSaveRoutePlan: (planName: string) => void;
}

export const RoutingPanel: React.FC<RoutingPanelProps> = ({
  origin,
  destination,
  waypoints,
  setOrigin,
  setDestination,
  setWaypoints,
  onCalculateRoute,
  onOptimizeTrip,
  routeResult,
  nearbyEquipments,
  onSearchNearby,
  onSaveRoutePlan,
}) => {
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [planName, setPlanName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  const handleMoveWaypoint = (index: number, direction: 'UP' | 'DOWN') => {
    const newWaypoints = [...waypoints];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newWaypoints.length) return;

    const temp = newWaypoints[index];
    newWaypoints[index] = newWaypoints[targetIdx];
    newWaypoints[targetIdx] = temp;
    setWaypoints(newWaypoints);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}시간 ${remainMins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', overflowY: 'auto' }}>
      {/* Origin & Destination Inputs */}
      <div style={{ backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#60a5fa' }}>📍 출발지 및 목적지</div>

        {/* Origin */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>출발지</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              className="input-field"
              readOnly
              value={origin ? `${origin.name} (${origin.coordinate[0].toFixed(4)}, ${origin.coordinate[1].toFixed(4)})` : '지지도/마커에서 출발지 지정'}
            />
            {origin && <Trash2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => setOrigin(null)} />}
          </div>
        </div>

        {/* Destination */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>목적지</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              className="input-field"
              readOnly
              value={destination ? `${destination.name} (${destination.coordinate[0].toFixed(4)}, ${destination.coordinate[1].toFixed(4)})` : '지도/마커에서 목적지 지정'}
            />
            {destination && <Trash2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => setDestination(null)} />}
          </div>
        </div>
      </div>

      {/* Waypoints List */}
      <div style={{ backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#f59e0b' }}>🚩 경유 설비 ({waypoints.length}개)</span>
        </div>

        {waypoints.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            설비 목록 또는 지도에서 경유지를 추가하세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {waypoints.map((wp, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontWeight: 600, marginRight: '6px' }}>{idx + 1}.</span>
                  <span>{wp.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <ArrowUp size={14} style={{ cursor: 'pointer' }} onClick={() => handleMoveWaypoint(idx, 'UP')} />
                  <ArrowDown size={14} style={{ cursor: 'pointer' }} onClick={() => handleMoveWaypoint(idx, 'DOWN')} />
                  <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => handleRemoveWaypoint(idx)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn" onClick={onCalculateRoute} disabled={!origin || !destination}>
          <Navigation size={16} /> 경로 계산
        </button>
        <button className="btn btn-secondary" onClick={onOptimizeTrip} disabled={!origin || !destination || waypoints.length === 0}>
          <Sparkles size={16} /> 순서 최적화
        </button>
      </div>

      {/* Calculation Result Summary */}
      {routeResult && (
        <div style={{ backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', padding: '12px', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#93c5fd' }}>🛣️ 경로 탐색 결과</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div>총 이동거리: <b>{formatDistance(routeResult.distance_meters)}</b></div>
            <div>예상 소요시간: <b>{formatDuration(routeResult.duration_seconds)}</b></div>
          </div>
          <button className="btn" style={{ width: '100%', marginTop: '10px', backgroundColor: '#16a34a' }} onClick={() => setShowSaveModal(true)}>
            <Save size={14} /> 방문 계획으로 저장
          </button>
        </div>
      )}

      {/* Nearby Equipment Search Section */}
      {routeResult && (
        <div style={{ backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>🔍 경로 주변 설비 검색</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <select className="input-field" value={searchRadius} onChange={e => setSearchRadius(Number(e.target.value))}>
              <option value={500}>반경 500m 이내</option>
              <option value={1000}>반경 1km 이내</option>
              <option value={3000}>반경 3km 이내</option>
              <option value={5000}>반경 5km 이내</option>
            </select>
            <button className="btn btn-secondary" onClick={() => onSearchNearby(searchRadius)}>
              <Search size={14} /> 검색
            </button>
          </div>

          {nearbyEquipments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>검색된 설비 ({nearbyEquipments.length}개):</div>
              {nearbyEquipments.map(eq => (
                <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{eq.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({eq.distance_from_route_meters}m 이격)</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                    onClick={() => setWaypoints(prev => [...prev, { id: eq.equipment_id, name: eq.name, coordinate: [eq.longitude, eq.latitude], equipment_id: eq.equipment_id }])}
                  >
                    + 경유지
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Plan Modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '380px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>방문 계획 저장</h3>
            <input
              type="text"
              className="input-field"
              placeholder="방문 계획 명칭 입력..."
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => { onSaveRoutePlan(planName); setShowSaveModal(false); }}>
                저장
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSaveModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
