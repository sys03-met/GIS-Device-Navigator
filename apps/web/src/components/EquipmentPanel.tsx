import React, { useState } from 'react';
import { Search, Plus, Upload, Download, RefreshCw, X, Check } from 'lucide-react';

interface EquipmentPanelProps {
  equipments: any[];
  selectedEquipment: any | null;
  onSelectEquipment: (eq: any | null) => void;
  onRefresh: () => void;
  onSelectAsOrigin: (eq: any) => void;
  onSelectAsDestination: (eq: any) => void;
  onAddToWaypoint: (eq: any) => void;
}

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipments,
  selectedEquipment,
  onSelectEquipment,
  onRefresh,
  onSelectAsOrigin,
  onSelectAsDestination,
  onAddToWaypoint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    equipment_id: '',
    name: '',
    address: '',
    latitude: 37.5665,
    longitude: 126.9780,
    equipment_type: 'OTHER',
    status: 'NORMAL',
    description: '',
  });

  const filteredEquipments = equipments.filter(eq => {
    const matchesQuery = !searchQuery ||
      eq.equipment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.address && eq.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !filterType || eq.equipment_type === filterType;
    const matchesStatus = !filterStatus || eq.status === filterStatus;

    return matchesQuery && matchesType && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('설비가 등록되었습니다.');
        setShowAddModal(false);
        onRefresh();
      } else {
        alert(`등록 실패: ${data.error.message}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleCsvImport = async () => {
    try {
      const res = await fetch('/api/v1/equipment/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`총 ${data.data.imported_count}개의 설비를 가져왔습니다.${data.data.errors.length ? '\n오류:\n' + data.data.errors.join('\n') : ''}`);
        setShowImportModal(false);
        setCsvText('');
        onRefresh();
      } else {
        alert(`가져오기 실패: ${data.error.message}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 설비를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/v1/equipment/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('삭제되었습니다.');
        onSelectEquipment(null);
        onRefresh();
      }
    } catch (err: any) {
      alert(`삭제 오류: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and Filters */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="설비 ID, 설비명, 주소 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">전체 유형</option>
            <option value="SUBSTATION">변전소</option>
            <option value="TRANSMISSION">송전탑</option>
            <option value="DISTRIBUTION">배전반</option>
            <option value="CONTROL_UNIT">제어기</option>
            <option value="OTHER">기타</option>
          </select>
          <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">전체 상태</option>
            <option value="NORMAL">정상</option>
            <option value="INSPECTION">점검필요</option>
            <option value="REPAIR">수리중</option>
            <option value="DISABLED">운휴</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" style={{ flex: 1, fontSize: '12px' }} onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> 등록
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '12px' }} onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> CSV 가져오기
          </button>
          <a className="btn btn-secondary" style={{ fontSize: '12px', textDecoration: 'none' }} href="/api/v1/equipment/export/csv" download>
            <Download size={14} />
          </a>
        </div>
      </div>

      {/* Equipment Count */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>검색 결과: {filteredEquipments.length}건</span>
        <RefreshCw size={14} style={{ cursor: 'pointer' }} onClick={onRefresh} />
      </div>

      {/* Equipment List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEquipments.map(eq => (
          <div
            key={eq.id}
            onClick={() => onSelectEquipment(eq)}
            style={{
              padding: '10px 12px',
              backgroundColor: selectedEquipment?.id === eq.id ? 'var(--bg-card)' : 'var(--bg-dark)',
              border: `1px solid ${selectedEquipment?.id === eq.id ? '#3b82f6' : 'var(--border-color)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{eq.name}</span>
              <span className={`badge badge-${eq.status}`}>{eq.status}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              ID: {eq.equipment_id} | 유형: {eq.equipment_type}
            </div>
            {eq.address && (
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                📍 {eq.address}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Equipment Actions Footer */}
      {selectedEquipment && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
            [{selectedEquipment.equipment_id}] {selectedEquipment.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '6px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 4px' }} onClick={() => onSelectAsOrigin(selectedEquipment)}>
              출발지 지정
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 4px' }} onClick={() => onAddToWaypoint(selectedEquipment)}>
              경유지 추가
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 4px' }} onClick={() => onSelectAsDestination(selectedEquipment)}>
              목적지 지정
            </button>
          </div>
          <button className="btn btn-danger" style={{ width: '100%', fontSize: '12px', padding: '6px' }} onClick={() => handleDelete(selectedEquipment.id)}>
            설비 삭제
          </button>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '400px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px' }}>신규 설비 등록</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" className="input-field" placeholder="설비 ID (필수, 고유)" required value={formData.equipment_id} onChange={e => setFormData({ ...formData, equipment_id: e.target.value })} />
              <input type="text" className="input-field" placeholder="설비명 (필수)" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input type="text" className="input-field" placeholder="도로명 주소" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="number" step="any" className="input-field" placeholder="위도 (Latitude)" required value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} />
                <input type="number" step="any" className="input-field" placeholder="경도 (Longitude)" required value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} />
              </div>
              <select className="input-field" value={formData.equipment_type} onChange={e => setFormData({ ...formData, equipment_type: e.target.value })}>
                <option value="SUBSTATION">변전소</option>
                <option value="TRANSMISSION">송전탑</option>
                <option value="DISTRIBUTION">배전반</option>
                <option value="CONTROL_UNIT">제어기</option>
                <option value="OTHER">기타</option>
              </select>
              <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="NORMAL">정상</option>
                <option value="INSPECTION">점검필요</option>
                <option value="REPAIR">수리중</option>
                <option value="DISABLED">운휴</option>
              </select>
              <textarea className="input-field" placeholder="비고 / 설명" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              <button type="submit" className="btn" style={{ marginTop: '8px' }}>등록하기</button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '480px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px' }}>CSV 설비 대량 가져오기</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowImportModal(false)} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              헤더 포함 CSV 데이터 (equipment_id, name, address, latitude, longitude, equipment_type, status)
            </p>
            <textarea
              className="input-field"
              rows={8}
              placeholder="equipment_id,name,address,latitude,longitude,equipment_type,status&#10;EQ-001,변전소 A,서울,37.5,127.0,SUBSTATION,NORMAL"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <button className="btn" style={{ width: '100%', marginTop: '12px' }} onClick={handleCsvImport}>
              가져오기 실행
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
