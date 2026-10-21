import React, { useState } from 'react';
import { Equipment, Coordinate, RoutePlan, NearbyEquipmentResult } from '@equip-nav/contracts';
import { Navigation, Save, FolderOpen, ArrowUpDown, Trash2 } from 'lucide-react';

interface RoutePanelProps {
  origin: Coordinate | null;
  destination: Coordinate | null;
  viaEquipments: Equipment[];
  totalDistance: number;
  totalDuration: number;
  nearbyEquipments: NearbyEquipmentResult[];
  routePlans: RoutePlan[];
  onCalculateRoute: () => void;
  onSearchNearby: (radiusMeters: number) => void;
  onOptimizeVisitOrder: () => void;
  onRemoveVia: (equipmentId: string) => void;
  onReorderVia: (dragIndex: number, hoverIndex: number) => void;
  onSaveRoutePlan: (planName: string) => void;
  onLoadRoutePlan: (plan: RoutePlan) => void;
  onDeleteRoutePlan: (planId: number) => void;
  onAddVia: (eq: Equipment) => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  origin,
  destination,
  viaEquipments,
  totalDistance,
  totalDuration,
  nearbyEquipments,
  routePlans,
  onCalculateRoute,
  onSearchNearby,
  onOptimizeVisitOrder,
  onRemoveVia,
  onSaveRoutePlan,
  onLoadRoutePlan,
  onDeleteRoutePlan,
  onAddVia,
}) => {
  const [activeTab, setActiveTab] = useState<'route' | 'plans'>('route');
  const [radius, setRadius] = useState(1000); // meters
  const [planName, setPlanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} 분`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} 시간 ${remMins} 분`;
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    onSaveRoutePlan(planName.trim());
    setPlanName('');
    setShowSaveModal(false);
  };

  return (
    <div className="w-96 h-full bg-slate-900 text-slate-100 flex flex-col border-l border-slate-800 font-sans shadow-xl z-20">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950">
        <button
          onClick={() => setActiveTab('route')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'route' ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation size={14} /> 방문 경로 설정
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'plans' ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen size={14} /> 저장된 계획 ({routePlans.length})
        </button>
      </div>

      {activeTab === 'route' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Origin & Destination */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="font-semibold text-slate-300 w-12">출발지</span>
              <span className="text-slate-200 font-mono truncate">
                {origin ? `${origin[0].toFixed(4)}, ${origin[1].toFixed(4)}` : '지지도 우클릭 또는 마커 선택'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-slate-300 w-12">목적지</span>
              <span className="text-slate-200 font-mono truncate">
                {destination ? `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}` : '지도 우클릭 또는 마커 선택'}
              </span>
            </div>

            <button
              onClick={onCalculateRoute}
              disabled={!origin || !destination}
              className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              경로 계산 및 탐색
            </button>
          </div>

          {/* Route Summary */}
          {totalDistance > 0 && (
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">총 이동거리 / 예상시간</div>
                <div className="text-sm font-bold text-blue-400">
                  {formatDistance(totalDistance)} <span className="text-slate-500">|</span> {formatDuration(totalDuration)}
                </div>
              </div>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
              >
                <Save size={13} /> 저장
              </button>
            </div>
          )}

          {/* Via Equipment Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">경유 설비 ({viaEquipments.length})</span>
              {viaEquipments.length >= 2 && (
                <button
                  onClick={onOptimizeVisitOrder}
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1"
                >
                  <ArrowUpDown size={12} /> OSRM 방문순서 자동조정
                </button>
              )}
            </div>

            {viaEquipments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                경유할 설비가 선택되지 않았습니다.<br />좌측 목록의 [+경유] 버튼을 누르세요.
              </div>
            ) : (
              viaEquipments.map((eq, idx) => (
                <div
                  key={eq.equipment_id}
                  className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-blue-400 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{eq.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{eq.equipment_id}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveVia(eq.equipment_id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Nearby Search */}
          {origin && destination && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>경로 주변 설비 검색</span>
                <select
                  value={radius}
                  onChange={(e) => {
                    const r = parseInt(e.target.value, 10);
                    setRadius(r);
                    onSearchNearby(r);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded"
                >
                  <option value={500}>500m 이내</option>
                  <option value={1000}>1km 이내</option>
                  <option value={3000}>3km 이내</option>
                  <option value={5000}>5km 이내</option>
                </select>
              </div>

              {nearbyEquipments.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-2">검색된 경로 주변 설비가 없습니다.</div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {nearbyEquipments.map((res) => {
                    const isAdded = viaEquipments.some((v) => v.equipment_id === res.equipment.equipment_id);
                    return (
                      <div
                        key={res.equipment.equipment_id}
                        className="p-2 bg-slate-800/40 rounded border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-300">{res.equipment.name}</div>
                          <div className="text-[10px] text-slate-400">
                            경로 이격거리: <span className="text-amber-400 font-mono">{res.distanceFromRouteMeters}m</span>
                          </div>
                        </div>
                        <button
                          disabled={isAdded}
                          onClick={() => onAddVia(res.equipment)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                            isAdded
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isAdded ? '추가됨' : '+ 경유추가'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Plans Tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {routePlans.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-12">저장된 방문 계획이 없습니다.</div>
          ) : (
            routePlans.map((plan) => (
              <div key={plan.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-white">{plan.name}</div>
                  <button
                    onClick={() => plan.id && onDeleteRoutePlan(plan.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>경유 설비: {plan.stops.length}개</span>
                  <span className="font-mono text-blue-400">
                    {formatDistance(plan.total_distance)} | {formatDuration(plan.total_duration)}
                  </span>
                </div>

                <button
                  onClick={() => onLoadRoutePlan(plan)}
                  className="w-full py-1.5 bg-slate-700 hover:bg-blue-600 text-white rounded text-xs transition font-semibold"
                >
                  계획 불러오기 및 재계산
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 text-slate-100 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-700">
            <h2 className="text-base font-bold text-white border-b border-slate-700 pb-2">방문 계획 저장</h2>
            <form onSubmit={handleSaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">방문 계획 이름 *</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="예: 강남구 주말 변압기 점검"
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  취소
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-semibold">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
