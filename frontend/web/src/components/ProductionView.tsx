import React, { useState } from 'react';
import { useMillData } from '../context/MillDataContext';
import { ProductionTrendChart, ShiftPerformanceBars, StageDistributionDonut } from './MillCharts';
import { 
  Layers, 
  Plus, 
  QrCode, 
  Search, 
  FastForward, 
  CheckCircle2, 
  X,
  Scissors,
  AlertOctagon,
  Printer
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const { lots, addLot, advanceLotStage, orders } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDoffingModalOpen, setIsDoffingModalOpen] = useState(false);
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [selectedLotForTraveler, setSelectedLotForTraveler] = useState<any>(null);

  // Form State
  const [orderNumber, setOrderNumber] = useState(orders[0]?.orderNumber || 'PO-LF-2026-8841');
  const [clientName, setClientName] = useState(orders[0]?.clientName || 'Khaadi Apparel');
  const [fabricSpec, setFabricSpec] = useState(orders[0]?.fabricSpec || 'Lawn Printed Kurti 80/80');
  const [targetMetres, setTargetMetres] = useState<number>(20000);
  const [loomNumber, setLoomNumber] = useState('PICANOL-OMNI-08');
  const [supervisorName, setSupervisorName] = useState('Ustad Shaukat (Shift A)');
  const [efficiencyPercent, setEfficiencyPercent] = useState<number>(95);

  // Doffing State
  const [doffLoom, setDoffLoom] = useState('PICANOL-OMNI-08');
  const [doffRollNumber, setDoffRollNumber] = useState('ROLL-L08-301');
  const [doffMetres, setDoffMetres] = useState<number>(120);
  const [doffWeightKg, setDoffWeightKg] = useState<number>(24.5);

  // Downtime State
  const [downtimeLoom, setDowntimeLoom] = useState('PICANOL-OMNI-04');
  const [downtimeReason, setDowntimeReason] = useState('Weft Feeder Sensor Stop');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(18);

  const filteredLots = lots.filter((lot) => {
    const matchesSearch = lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.fabricSpec.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lot.loomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || lot.stageCode === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalTargetMetres = lots.reduce((sum, l) => sum + l.targetMetres, 0);
  const totalProducedMetres = lots.reduce((sum, l) => sum + l.producedMetres, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !clientName || targetMetres <= 0) {
      alert('Please fill all lot parameters.');
      return;
    }

    addLot({
      orderNumber,
      clientName,
      fabricSpec,
      stageCode: 'WEAVING',
      stageName: 'Weaving Shed #01',
      targetMetres: Number(targetMetres),
      loomNumber,
      supervisorName,
      efficiencyPercent: Number(efficiencyPercent),
      status: 'Optimal'
    });

    setIsModalOpen(false);
  };

  const handleDoffingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Roll #${doffRollNumber} (${doffMetres}m, ${doffWeightKg}kg) successfully doffed and tagged with barcode.`);
    setIsDoffingModalOpen(false);
  };

  const handleDowntimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Loom stoppage logged for ${downtimeLoom}: ${downtimeReason} (${downtimeMinutes} mins). Maintenance alerted.`);
    setIsDowntimeModalOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Layers size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Production Telemetry & Loom Stage Tracking
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Real-time air-jet looms, rotary printing presses, dyeing vats, and QR lot tracking
          </p>
        </div>

        {/* Industrial Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Export Shift Sheet</span>
          </button>

          <button 
            onClick={() => setIsDowntimeModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <AlertOctagon size={15} />
            <span>Loom Stoppage Log</span>
          </button>

          <button 
            onClick={() => setIsDoffingModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Scissors size={15} color="var(--blue-primary)" />
            <span>Log Shift Doffing</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Issue New Lot / QR</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE LOTS IN MILL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {lots.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● All stages synchronized via QR scanner
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROGRESS METRES WOVEN</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            {(totalProducedMetres / 1000).toFixed(1)}k <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {(totalTargetMetres / 1000).toFixed(1)}k m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {((totalProducedMetres / totalTargetMetres) * 100).toFixed(1)}% Batch completion rate
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE OEE EFFICIENCY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            94.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Top tier world-class textile benchmark
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE AIR-JET LOOMS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            68 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Picanol & Toyota</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            0 machine breakdowns reported
          </div>
        </div>
      </div>

      {/* TOP-LEVEL CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        <ProductionTrendChart />
        <StageDistributionDonut />
      </div>

      <ShiftPerformanceBars />

      {/* Lots Control Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by lot QR #, buyer, machine #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Stage Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'WEAVING', 'DYEING', 'PRINTING', 'PACKING'].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              style={{
                background: stageFilter === stg ? 'var(--blue-primary)' : 'var(--bg-subtle)',
                color: stageFilter === stg ? '#ffffff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Lots Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>LOT / QR TRACKER</th>
              <th style={{ padding: '12px 14px' }}>BUYER & ORDER</th>
              <th style={{ padding: '12px 14px' }}>FABRIC SPEC</th>
              <th style={{ padding: '12px 14px' }}>CURRENT STAGE</th>
              <th style={{ padding: '12px 14px' }}>MACHINE #</th>
              <th style={{ padding: '12px 14px' }}>PROGRESS (METRES)</th>
              <th style={{ padding: '12px 14px' }}>EFFICIENCY</th>
              <th style={{ padding: '12px 14px' }}>SUPERVISOR</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLots.map((lot) => {
              const pct = Math.min(Math.round((lot.producedMetres / lot.targetMetres) * 100), 100);

              return (
                <tr 
                  key={lot.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QrCode size={16} color="var(--blue-primary)" />
                      <span>{lot.lotNumber}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{lot.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lot.orderNumber}</div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-dim)', fontWeight: 500 }}>
                    {lot.fabricSpec}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-blue">
                      {lot.stageName}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {lot.loomNumber}
                  </td>
                  <td style={{ padding: '14px', minWidth: '160px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{lot.producedMetres.toLocaleString()} m</span>
                      <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue-primary)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontWeight: 700, color: lot.efficiencyPercent >= 92 ? 'var(--emerald)' : 'var(--gold)' }}>
                      {lot.efficiencyPercent}%
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {lot.supervisorName}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => advanceLotStage(lot.id)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Advance to next production stage"
                      >
                        <FastForward size={13} color="var(--blue-primary)" />
                        <span>Advance Stage</span>
                      </button>
                      <button
                        onClick={() => setSelectedLotForTraveler(lot)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="View & Print Textile QR Traveler Card"
                      >
                        <QrCode size={13} color="var(--blue-primary)" />
                        <span>Traveler</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Workable Modal: Shift Doffing Log */}
      {isDoffingModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDoffingModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '540px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scissors size={20} color="var(--blue-primary)" />
                <span>Log Shift Doffing (Cloth Roll Cut)</span>
              </h3>
              <button onClick={() => setIsDoffingModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDoffingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-grid-2">
                <div>
                  <label className="label">Loom Machine ID *</label>
                  <input type="text" className="input-field" value={doffLoom} onChange={(e) => setDoffLoom(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Cut Roll Piece Tag # *</label>
                  <input type="text" className="input-field" value={doffRollNumber} onChange={(e) => setDoffRollNumber(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="label">Doffed Metres (m) *</label>
                  <input type="number" className="input-field" value={doffMetres} onChange={(e) => setDoffMetres(Number(e.target.value))} min="10" required />
                </div>
                <div>
                  <label className="label">Gross Weight (kg) *</label>
                  <input type="number" step="0.1" className="input-field" value={doffWeightKg} onChange={(e) => setDoffWeightKg(Number(e.target.value))} required />
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsDoffingModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Tag Roll & Send to Grey QC</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workable Modal: Loom Stoppage / Downtime Log */}
      {isDowntimeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDowntimeModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '540px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--rose)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={20} />
                <span>Log Loom Stoppage & Downtime</span>
              </h3>
              <button onClick={() => setIsDowntimeModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDowntimeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Stopped Loom Machine *</label>
                <input type="text" className="input-field" value={downtimeLoom} onChange={(e) => setDowntimeLoom(e.target.value)} required />
              </div>
              <div>
                <label className="label">Stoppage Root Cause *</label>
                <select className="input-field" value={downtimeReason} onChange={(e) => setDowntimeReason(e.target.value)}>
                  <option value="Weft Feeder Sensor Stop">Weft Feeder Sensor Stop (Weft Break)</option>
                  <option value="Warp End Breakage">Warp End Breakage (Drop Wire Stop)</option>
                  <option value="Mechanical Jam / Rapier Gripper">Mechanical Jam / Rapier Gripper Fault</option>
                  <option value="Warp Beam Exhausted">Warp Beam Exhausted (Beam Gaiting Needed)</option>
                  <option value="Main Motor Overheat">Main Motor Overheat / Inverter Alarm</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Stoppage Duration (Minutes) *</label>
                <input type="number" className="input-field" value={downtimeMinutes} onChange={(e) => setDowntimeMinutes(Number(e.target.value))} min="1" required />
              </div>
              <div className="form-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsDowntimeModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--rose)', borderColor: 'var(--rose)' }}>Log Incident to Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Traveler Floor Card Modal */}
      {selectedLotForTraveler && (
        <div className="modal-overlay" onClick={() => setSelectedLotForTraveler(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '620px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-medium)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>
                  Textile Floor Batch Traveler Card
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lahore Fashion Textile Mills • Vertically Integrated ERP
                </span>
              </div>
              <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <Printer size={15} />
                <span>Print Card</span>
              </button>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOT BATCH IDENTIFIER</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>
                  {selectedLotForTraveler.lotNumber}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {selectedLotForTraveler.clientName} ({selectedLotForTraveler.orderNumber})
                </div>
              </div>
              <div style={{ padding: '8px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                <QrCode size={56} color="var(--blue-primary)" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '18px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Fabric Specification:</span> <strong>{selectedLotForTraveler.fabricSpec}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Current Production Stage:</span> <strong>{selectedLotForTraveler.stageName}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Assigned Loom / Jet:</span> <strong>{selectedLotForTraveler.loomNumber}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Target Volume:</span> <strong>{selectedLotForTraveler.targetMetres.toLocaleString()} Metres</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Shift Supervisor:</span> <strong>{selectedLotForTraveler.supervisorName}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Target Efficiency:</span> <strong>{selectedLotForTraveler.efficiencyPercent}% OEE</strong></div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setSelectedLotForTraveler(null)} className="btn btn-secondary">Close Traveler</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Floor Router Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={20} color="var(--blue-primary)" />
                  <span>Issue New Production Lot & QR Tracker</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Assign weaving loom, allocate supervisor, and generate tracking QR code
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Select Buyer Order (PO) *</label>
                <select
                  className="input-field"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    const selected = orders.find(o => o.orderNumber === e.target.value);
                    if (selected) {
                      setClientName(selected.clientName);
                      setFabricSpec(selected.fabricSpec);
                      setTargetMetres(selected.quantityMetres);
                    }
                  }}
                  required
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.orderNumber} - {o.clientName} ({o.fabricSpec})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Buyer Name</label>
                  <input type="text" className="input-field" value={clientName} readOnly />
                </div>

                <div>
                  <label className="label">Batch Target Metres *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1000"
                    step="500"
                    value={targetMetres}
                    onChange={(e) => setTargetMetres(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Fabric Specification</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={fabricSpec}
                  onChange={(e) => setFabricSpec(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Assigned Loom / Machine # *</label>
                  <select
                    className="input-field"
                    value={loomNumber}
                    onChange={(e) => setLoomNumber(e.target.value)}
                  >
                    <option value="PICANOL-OMNI-08">Picanol OmniPlus Air-Jet Loom #08</option>
                    <option value="PICANOL-OMNI-14">Picanol OmniPlus Air-Jet Loom #14</option>
                    <option value="TOYOTA-JAT-22">Toyota JAT810 Weaving Loom #22</option>
                    <option value="DYE-JET-03">Thies Eco-Master Dyeing Jet #03</option>
                    <option value="PRINT-REGG-01">Reggiani 12-Color Rotary Print Press #01</option>
                  </select>
                </div>

                <div>
                  <label className="label">Floor Shift Supervisor *</label>
                  <select
                    className="input-field"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                  >
                    <option value="Ustad Shaukat (Shift A)">Ustad Shaukat (Shift A)</option>
                    <option value="Rana Mumtaz (Shift B)">Rana Mumtaz (Shift B)</option>
                    <option value="Irfan Cheema (Shift A)">Irfan Cheema (Shift A)</option>
                    <option value="Bashir Ahmed (Shift C)">Bashir Ahmed (Shift C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Target Loom Speed & Efficiency Benchmark (%)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  min="80"
                  max="100"
                  value={efficiencyPercent}
                  onChange={(e) => setEfficiencyPercent(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Generate Lot QR & Dispatch to Floor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
