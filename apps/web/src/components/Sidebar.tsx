import React, { useState } from 'react';
import { Equipment, EquipmentStatus } from '@equip-nav/contracts';
import { Search, Plus, Upload, Download, Trash2 } from 'lucide-react';

interface SidebarProps {
  equipments: Equipment[];
  selectedEquipment: Equipment | null;
  onSelectEquipment: (eq: Equipment) => void;
  onFilterChange: (type: string, status: string, search: string) => void;
  onImportCsv: (csvText: string) => void;
  onExportCsv: () => void;
  onCreateEquipment: (eqData: Partial<Equipment>) => void;
  onDeleteEquipment: (id: number) => void;
  onAddVia: (eq: Equipment) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  equipments,
  selectedEquipment,
  onSelectEquipment,
  onFilterChange,
  onImportCsv,
  onExportCsv,
  onCreateEquipment,
  onDeleteEquipment,
  onAddVia,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newEqId, setNewEqId] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [newLat, setNewLat] = useState('37.501');
  const [newLng, setNewLng] = useState('127.039');
  const [newType, setNewType] = useState('TRANSFORMER');
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('NORMAL');

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onFilterChange(typeFilter, statusFilter, val);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    onFilterChange(val, statusFilter, search);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    onFilterChange(typeFilter, val, search);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) onImportCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqId || !newName) {
      alert('설비 ID와 설비명은 필수 입력 항목입니다.');
      return;
    }
    onCreateEquipment({
      equipment_id: newEqId,
      name: newName,
      address: newAddr,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      equipment_type: newType,
      status: newStatus,
    });
    setShowAddModal(false);
    setNewEqId('');
    setNewName('');
  };

  return (
    <div className="w-80 h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 font-sans shadow-xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            EquipNav
          </h1>
          <p className="text-xs text-slate-400">오프라인 설비 & 방문 경로 시스템</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition text-xs font-semibold flex items-center gap-1 shadow"
        >
          <Plus size={14} /> 등록
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/50">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="설비 ID, 이름, 주소 검색..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="flex-1 bg-slate-800 text-slate-300 text-xs px-2 py-1.5 rounded border border-slate-700 focus:outline-none"
          >
            <option value="">전체 유형</option>
            <option value="TRANSFORMER">변압기</option>
            <option value="SWITCH">개폐기</option>
            <option value="BREAKER">차단기</option>
            <option value="GENERAL">일반 설비</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex-1 bg-slate-800 text-slate-300 text-xs px-2 py-1.5 rounded border border-slate-700 focus:outline-none"
          >
            <option value="">전체 상태</option>
            <option value="NORMAL">정상 (🟢)</option>
            <option value="WARNING">주의 (🟡)</option>
            <option value="ERROR">고장 (🔴)</option>
            <option value="MAINTENANCE">점검중 (🟣)</option>
          </select>
        </div>

        {/* CSV Import/Export */}
        <div className="flex justify-between items-center pt-1 text-xs">
          <label className="cursor-pointer text-slate-400 hover:text-blue-400 flex items-center gap-1">
            <Upload size={12} /> CSV 가져오기
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={onExportCsv} className="text-slate-400 hover:text-emerald-400 flex items-center gap-1">
            <Download size={12} /> CSV 내보내기
          </button>
        </div>
      </div>

      {/* Equipment List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-xs font-semibold text-slate-400 px-2 py-1 flex justify-between">
          <span>설비 목록 ({equipments.length})</span>
        </div>

        {equipments.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10">검색 조건에 일치하는 설비가 없습니다.</div>
        ) : (
          equipments.map((eq) => {
            const isSelected = selectedEquipment?.id === eq.id;
            return (
              <div
                key={eq.equipment_id}
                onClick={() => onSelectEquipment(eq)}
                className={`p-2.5 rounded-lg cursor-pointer transition flex justify-between items-start border ${
                  isSelected
                    ? 'bg-blue-900/40 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-0.5 max-w-[190px]">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        eq.status === 'NORMAL'
                          ? 'bg-emerald-500'
                          : eq.status === 'WARNING'
                          ? 'bg-amber-500'
                          : eq.status === 'ERROR'
                          ? 'bg-red-500'
                          : 'bg-purple-500'
                      }`}
                    />
                    <span className="truncate">{eq.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({eq.equipment_id})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{eq.address || '주소 미등록'}</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddVia(eq);
                    }}
                    className="p-1 bg-slate-700 hover:bg-blue-600 text-slate-200 rounded text-[10px] transition"
                    title="방문 경유지에 추가"
                  >
                    +경유
                  </button>
                  {eq.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`설비 ${eq.name}를 삭제하시겠습니까?`)) {
                          onDeleteEquipment(eq.id!);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 text-slate-100 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl border border-slate-700">
            <h2 className="text-base font-bold text-white border-b border-slate-700 pb-2">신규 설비 등록</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">설비 고유 ID *</label>
                <input
                  type="text"
                  required
                  value={newEqId}
                  onChange={(e) => setNewEqId(e.target.value)}
                  placeholder="예: EQ-2024-001"
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">설비명 *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 역삼 변압기 1호"
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">도로명주소</label>
                <input
                  type="text"
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  placeholder="서울특별시 강남구..."
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">위도 (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">경도 (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">설비 유형</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  >
                    <option value="TRANSFORMER">변압기</option>
                    <option value="SWITCH">개폐기</option>
                    <option value="BREAKER">차단기</option>
                    <option value="GENERAL">일반</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">설비 상태</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as EquipmentStatus)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  >
                    <option value="NORMAL">정상 (NORMAL)</option>
                    <option value="WARNING">주의 (WARNING)</option>
                    <option value="ERROR">고장 (ERROR)</option>
                    <option value="MAINTENANCE">점검중 (MAINTENANCE)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  취소
                </button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 font-semibold">
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
