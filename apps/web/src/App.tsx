import React, { useState, useEffect } from 'react';
import { MapView } from './components/MapView';
import { EquipmentPanel } from './components/EquipmentPanel';
import { RoutingPanel } from './components/RoutingPanel';
import { MapPin, Navigation, Wrench, ListFilter, Trash2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'EQUIPMENT' | 'ROUTING' | 'PLANS'>('EQUIPMENT');
  const [equipments, setEquipments] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);

  // Routing State
  const [origin, setOrigin] = useState<any | null>(null);
  const [destination, setDestination] = useState<any | null>(null);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [routeResult, setRouteResult] = useState<any | null>(null);
  const [nearbyEquipments, setNearbyEquipments] = useState<any[]>([]);
  const [routePlans, setRoutePlans] = useState<any[]>([]);

  const fetchEquipments = () => {
    fetch('/api/v1/equipment')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEquipments(data.data);
      })
      .catch(console.error);
  };

  const fetchRoutePlans = () => {
    fetch('/api/v1/route-plans')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRoutePlans(data.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchEquipments();
    fetchRoutePlans();
  }, []);

  const handleMapClick = (lng: number, lat: number) => {
    // If setting origin or destination on map click when tab is ROUTING
    if (activeTab === 'ROUTING') {
      if (!origin) {
        setOrigin({ name: `임의 출발지 (${lng.toFixed(3)}, ${lat.toFixed(3)})`, coordinate: [lng, lat] });
      } else if (!destination) {
        setDestination({ name: `임의 목적지 (${lng.toFixed(3)}, ${lat.toFixed(3)})`, coordinate: [lng, lat] });
      }
    }
  };

  const handleMarkerClick = (equipmentId: string) => {
    const eq = equipments.find(item => item.equipment_id === equipmentId);
    if (eq) {
      setSelectedEquipment(eq);
    }
  };

  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;
    try {
      const res = await fetch('/api/v1/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.coordinate,
          destination: destination.coordinate,
          waypoints: waypoints.map(w => w.coordinate),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRouteResult(data.data);
      } else {
        alert(`경로 계산 실패: ${data.error.message}`);
      }
    } catch (err: any) {
      alert(`경로 계산 오류: ${err.message}`);
    }
  };

  const handleOptimizeTrip = async () => {
    if (!origin || !destination || waypoints.length === 0) return;
    try {
      const res = await fetch('/api/v1/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.coordinate,
          destination: destination.coordinate,
          stops: waypoints.map(w => ({
            id: w.equipment_id || w.id,
            coordinate: w.coordinate,
            name: w.name,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRouteResult(data.data);
        // Reorder waypoints based on returned waypoint_order
        const order = data.data.waypoint_order;
        if (order && order.length >= waypoints.length + 2) {
          const waypointIndices = order.slice(1, order.length - 1);
          const reordered = waypointIndices.map((idx: number) => waypoints[idx - 1]).filter(Boolean);
          setWaypoints(reordered);
        }
      } else {
        alert(`경로 최적화 실패: ${data.error.message}`);
      }
    } catch (err: any) {
      alert(`경로 최적화 오류: ${err.message}`);
    }
  };

  const handleSearchNearby = async (radiusMeters: number) => {
    if (!routeResult || !routeResult.geometry_geojson) return;
    try {
      const res = await fetch('/api/v1/routes/nearby-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_coordinates: routeResult.geometry_geojson.coordinates,
          radius_meters: radiusMeters,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNearbyEquipments(data.data);
      }
    } catch (err: any) {
      alert(`주변 설비 검색 오류: ${err.message}`);
    }
  };

  const handleSaveRoutePlan = async (planName: string) => {
    if (!routeResult || !origin || !destination) return;

    const stops = [
      { stop_order: 0, equipment_id: origin.equipment_id, name: origin.name, longitude: origin.coordinate[0], latitude: origin.coordinate[1], stop_type: 'ORIGIN' },
      ...waypoints.map((wp, idx) => ({
        stop_order: idx + 1,
        equipment_id: wp.equipment_id,
        name: wp.name,
        longitude: wp.coordinate[0],
        latitude: wp.coordinate[1],
        stop_type: 'WAYPOINT',
      })),
      { stop_order: waypoints.length + 1, equipment_id: destination.equipment_id, name: destination.name, longitude: destination.coordinate[0], latitude: destination.coordinate[1], stop_type: 'DESTINATION' },
    ];

    try {
      const res = await fetch('/api/v1/route-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName || '신규 방문 계획',
          origin_name: origin.name,
          origin_coordinate: origin.coordinate,
          destination_name: destination.name,
          destination_coordinate: destination.coordinate,
          total_distance_meters: routeResult.distance_meters,
          total_duration_seconds: routeResult.duration_seconds,
          stops,
          geometry_geojson: JSON.stringify(routeResult.geometry_geojson),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('방문 계획이 성공적으로 저장되었습니다.');
        fetchRoutePlans();
      }
    } catch (err: any) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  const handleDeleteRoutePlan = async (id: number) => {
    if (!confirm('정말 이 방문 계획을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/v1/route-plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRoutePlans();
      }
    } catch (err: any) {
      alert(`삭제 오류: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title">
          <Navigation size={22} />
          <span>EquipNav — 오프라인 설비 지도 & 방문 경로 관리 시스템</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'EQUIPMENT' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('EQUIPMENT')}
          >
            <Wrench size={16} /> 설비 관리
          </button>
          <button
            className={`btn ${activeTab === 'ROUTING' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ROUTING')}
          >
            <Navigation size={16} /> 방문 경로 탐색
          </button>
          <button
            className={`btn ${activeTab === 'PLANS' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('PLANS')}
          >
            <ListFilter size={16} /> 저장된 계획 ({routePlans.length})
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="panel-header">
            {activeTab === 'EQUIPMENT' && '설비 목록 및 검색'}
            {activeTab === 'ROUTING' && '방문 경로 설정'}
            {activeTab === 'PLANS' && '저장된 방문 계획 목록'}
          </div>
          <div className="panel-body">
            {activeTab === 'EQUIPMENT' && (
              <EquipmentPanel
                equipments={equipments}
                selectedEquipment={selectedEquipment}
                onSelectEquipment={setSelectedEquipment}
                onRefresh={fetchEquipments}
                onSelectAsOrigin={eq => {
                  setOrigin({ name: eq.name, coordinate: [eq.longitude, eq.latitude], equipment_id: eq.equipment_id });
                  setActiveTab('ROUTING');
                }}
                onSelectAsDestination={eq => {
                  setDestination({ name: eq.name, coordinate: [eq.longitude, eq.latitude], equipment_id: eq.equipment_id });
                  setActiveTab('ROUTING');
                }}
                onAddToWaypoint={eq => {
                  setWaypoints(prev => [...prev, { id: eq.equipment_id, name: eq.name, coordinate: [eq.longitude, eq.latitude], equipment_id: eq.equipment_id }]);
                  setActiveTab('ROUTING');
                }}
              />
            )}

            {activeTab === 'ROUTING' && (
              <RoutingPanel
                origin={origin}
                destination={destination}
                waypoints={waypoints}
                setOrigin={setOrigin}
                setDestination={setDestination}
                setWaypoints={setWaypoints}
                onCalculateRoute={handleCalculateRoute}
                onOptimizeTrip={handleOptimizeTrip}
                routeResult={routeResult}
                nearbyEquipments={nearbyEquipments}
                onSearchNearby={handleSearchNearby}
                onSaveRoutePlan={handleSaveRoutePlan}
              />
            )}

            {activeTab === 'PLANS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {routePlans.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    저장된 방문 계획이 없습니다.
                  </div>
                ) : (
                  routePlans.map(plan => (
                    <div key={plan.id} style={{ backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{plan.name}</span>
                        <Trash2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-red)' }} onClick={() => handleDeleteRoutePlan(plan.id)} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        거리: {(plan.total_distance_meters / 1000).toFixed(2)} km | 소요: {Math.round(plan.total_duration_seconds / 60)}분 | 정거장: {plan.stops?.length || 0}개
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        출발: {plan.origin_name} ➔ 도착: {plan.destination_name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map Viewport */}
        <MapView
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          equipments={equipments}
          routeGeoJson={routeResult?.geometry_geojson ? {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: routeResult.geometry_geojson,
              properties: {}
            }]
          } : null}
        />
      </div>
    </div>
  );
}
