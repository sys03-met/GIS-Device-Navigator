import React, { useEffect, useState } from 'react';
import { MapView } from './components/MapView';
import { Sidebar } from './components/Sidebar';
import { RoutePanel } from './components/RoutePanel';
import {
  Equipment,
  Coordinate,
  GeoJSONLineString,
  NearbyEquipmentResult,
  RoutePlan,
} from '@equip-nav/contracts';

export const App: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Routing State
  const [origin, setOrigin] = useState<Coordinate | null>([127.03, 37.5]);
  const [destination, setDestination] = useState<Coordinate | null>([127.05, 37.52]);
  const [viaEquipments, setViaEquipments] = useState<Equipment[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<GeoJSONLineString | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [nearbyEquipments, setNearbyEquipments] = useState<NearbyEquipmentResult[]>([]);
  const [routePlans, setRoutePlans] = useState<RoutePlan[]>([]);

  // Fetch Equipments
  const fetchEquipments = async (type = '', status = '', search = '') => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const res = await fetch(`/api/v1/equipment?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEquipments(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch equipments:', err);
    }
  };

  // Fetch Route Plans
  const fetchRoutePlans = async () => {
    try {
      const res = await fetch('/api/v1/route-plans');
      const json = await res.json();
      if (json.success) {
        setRoutePlans(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch route plans:', err);
    }
  };

  useEffect(() => {
    fetchEquipments();
    fetchRoutePlans();
  }, []);

  // Calculate Route
  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;

    try {
      const res = await fetch('/api/v1/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          viaEquipmentIds: viaEquipments.map((e) => e.equipment_id),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRouteGeometry(json.data.geometry);
        setTotalDistance(json.data.distance);
        setTotalDuration(json.data.duration);
      } else {
        alert(`경로 계산 실패: ${json.error.message}`);
      }
    } catch (err: any) {
      alert(`경로 계산 서버 오류: ${err.message}`);
    }
  };

  // Search Nearby
  const handleSearchNearby = async (radiusMeters: number) => {
    if (!routeGeometry) return;

    try {
      const res = await fetch('/api/v1/routes/nearby-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeGeometry,
          radiusMeters,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNearbyEquipments(json.data);
      }
    } catch (err) {
      console.error('Nearby search error:', err);
    }
  };

  // Optimize Visit Order
  const handleOptimizeVisitOrder = async () => {
    if (!origin || !destination || viaEquipments.length < 2) return;

    try {
      const res = await fetch('/api/v1/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          viaEquipmentIds: viaEquipments.map((e) => e.equipment_id),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRouteGeometry(json.data.geometry);
        setTotalDistance(json.data.distance);
        setTotalDuration(json.data.duration);
      }
    } catch (err) {
      console.error('Optimize error:', err);
    }
  };

  // Equipment CRUD Handlers
  const handleCreateEquipment = async (eqData: Partial<Equipment>) => {
    try {
      const res = await fetch('/api/v1/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eqData),
      });

      const json = await res.json();
      if (json.success) {
        fetchEquipments();
      } else {
        alert(`설비 등록 실패: ${json.error.message}`);
      }
    } catch (err: any) {
      alert(`설비 등록 오류: ${err.message}`);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/equipment/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchEquipments();
      }
    } catch (err) {
      console.error('Delete equipment error:', err);
    }
  };

  const handleImportCsv = async (csvText: string) => {
    try {
      const res = await fetch('/api/v1/equipment/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csvText,
      });

      const json = await res.json();
      if (json.success) {
        alert(`CSV 가져오기 성공: 추가 ${json.data.inserted}건, 업데이트 ${json.data.updated}건`);
        fetchEquipments();
      } else {
        alert(`CSV 가져오기 실패: ${json.error.message}`);
      }
    } catch (err: any) {
      alert(`CSV 오류: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/v1/equipment/export-csv', '_blank');
  };

  // Save Route Plan
  const handleSaveRoutePlan = async (name: string) => {
    if (!origin || !destination) return;

    try {
      const res = await fetch('/api/v1/route-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          start_lng: origin[0],
          start_lat: origin[1],
          end_lng: destination[0],
          end_lat: destination[1],
          total_distance: totalDistance,
          total_duration: totalDuration,
          stops: viaEquipments.map((e, idx) => ({
            equipment_id: e.equipment_id,
            stop_order: idx + 1,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert('방문 계획이 성공적으로 저장되었습니다.');
        fetchRoutePlans();
      }
    } catch (err) {
      console.error('Save plan error:', err);
    }
  };

  // Load Route Plan
  const handleLoadRoutePlan = (plan: RoutePlan) => {
    setOrigin([plan.start_lng, plan.start_lat]);
    setDestination([plan.end_lng, plan.end_lat]);

    const loadedVias: Equipment[] = [];
    for (const stop of plan.stops) {
      const eq = equipments.find((e) => e.equipment_id === stop.equipment_id);
      if (eq) loadedVias.push(eq);
    }
    setViaEquipments(loadedVias);
  };

  const handleDeleteRoutePlan = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/route-plans/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchRoutePlans();
      }
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  };

  const handleAddVia = (eq: Equipment) => {
    if (!viaEquipments.some((v) => v.equipment_id === eq.equipment_id)) {
      setViaEquipments([...viaEquipments, eq]);
    }
  };

  const handleRemoveVia = (equipmentId: string) => {
    setViaEquipments(viaEquipments.filter((v) => v.equipment_id !== equipmentId));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Sidebar
        equipments={equipments}
        selectedEquipment={selectedEquipment}
        onSelectEquipment={setSelectedEquipment}
        onFilterChange={fetchEquipments}
        onImportCsv={handleImportCsv}
        onExportCsv={handleExportCsv}
        onCreateEquipment={handleCreateEquipment}
        onDeleteEquipment={handleDeleteEquipment}
        onAddVia={handleAddVia}
      />

      <MapView
        equipments={equipments}
        selectedEquipment={selectedEquipment}
        origin={origin}
        destination={destination}
        viaEquipments={viaEquipments}
        routeGeometry={routeGeometry}
        onSelectEquipment={setSelectedEquipment}
        onSetOrigin={setOrigin}
        onSetDestination={setDestination}
        onAddVia={handleAddVia}
      />

      <RoutePanel
        origin={origin}
        destination={destination}
        viaEquipments={viaEquipments}
        totalDistance={totalDistance}
        totalDuration={totalDuration}
        nearbyEquipments={nearbyEquipments}
        routePlans={routePlans}
        onCalculateRoute={handleCalculateRoute}
        onSearchNearby={handleSearchNearby}
        onOptimizeVisitOrder={handleOptimizeVisitOrder}
        onRemoveVia={handleRemoveVia}
        onReorderVia={() => {}}
        onSaveRoutePlan={handleSaveRoutePlan}
        onLoadRoutePlan={handleLoadRoutePlan}
        onDeleteRoutePlan={handleDeleteRoutePlan}
        onAddVia={handleAddVia}
      />
    </div>
  );
};
