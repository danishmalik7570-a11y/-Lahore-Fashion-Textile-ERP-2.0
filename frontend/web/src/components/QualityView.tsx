import React, { useState } from 'react';
import { useMillData } from '../context/MillDataContext';
import { QualityDefectTrendChart } from './MillCharts';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  CheckCircle2, 
  X,
  FileCheck2,
  Printer,
  Sparkles
} from 'lucide-react';

export const QualityView: React.FC = () => {
  const { qcAudits, addQCAudit, lots } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpectroModalOpen, setIsSpectroModalOpen] = useState(false);
  const [selectedAuditForTag, setSelectedAuditForTag] = useState<any>(null);

  // Form State
  const [lotNumber, setLotNumber] = useState(lots[0]?.lotNumber || 'LOT-LF-8841');
  const [fabricSpec, setFabricSpec] = useState(lots[0]?.fabricSpec || 'Lawn Printed Kurti 80/80');
  const [rollNumber, setRollNumber] = useState('ROLL-102');
  const [inspectedMetres, setInspectedMetres] = useState<number>(100);
  const [warpStreak, setWarpStreak] = useState<number>(1);
  const [slub, setSlub] = useState<number>(2);
  const [hole, setHole] = useState<number>(0);
  const [shadeVar, setShadeVar] = useState<number>(0);
  const [oilStain, setOilStain] = useState<number>(1);
  const [auditorName, setAuditorName] = useState('M. Kashif (Senior QC)');

  // Spectro State
  const [spectroLot, setSpectroLot] = useState('LOT-LF-8841');
  const [deltaE, setDeltaE] = useState<number>(0.65);
  const [spectroStatus, setSpectroStatus] = useState('Passed (Delta E < 1.0)');

  const totalPoints = warpStreak + slub + (hole * 4) + (shadeVar * 2) + oilStain;
  const pointsPer100M = Number(((totalPoints * 100) / (inspectedMetres || 100)).toFixed(1));
  const gradeResult = pointsPer100M <= 15 ? 'Pass - Grade A' : pointsPer100M <= 28 ? 'Pass - Grade B' : 'Fail - Defective';

  const filteredAudits = qcAudits.filter(a => 
    a.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumber || !rollNumber || inspectedMetres <= 0) {
      alert('Please fill all QC parameters.');
      return;
    }

    addQCAudit({
      lotNumber,
      fabricSpec,
      rollNumber,
      inspectedMetres: Number(inspectedMetres),
      totalDefectPoints: totalPoints,
      auditorName,
      defectBreakdown: {
        warpStreak: Number(warpStreak),
        slub: Number(slub),
        hole: Number(hole),
        shadeVar: Number(shadeVar),
        oilStain: Number(oilStain)
      }
    });

    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CheckSquare size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Quality Assurance & ASTM 4-Point Inspection
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            ASTM D5430 standard fabric defect grading, shade matching spectrophotometry, and lab audits
          </p>
        </div>

        {/* Industrial QA Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Print ASTM Certificate</span>
          </button>

          <button 
            onClick={() => setIsSpectroModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--purple)' }}
          >
            <Sparkles size={15} />
            <span>Spectro Shade Test (ΔE)</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Log 4-Point QC Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL PASS RATE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            98.4% <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Grade A/B</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● Export export standard compliance
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE DEFECT SCORE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            9.2 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>pts / 100m</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Allowed buyer tolerance: 28 pts / 100m
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ROLLS AUDITED TODAY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {qcAudits.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Rolls</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            100% full roll length illuminated inspection
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>REJECTION RATE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            0.6% <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cut Loss</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Within international 2% allowance
          </div>
        </div>
      </div>

      {/* Top Level QC Graph */}
      <QualityDefectTrendChart />

      {/* Search and Table */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search audits by audit #, lot #, roll #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>AUDIT CERTIFICATE</th>
              <th style={{ padding: '12px 14px' }}>LOT & ROLL #</th>
              <th style={{ padding: '12px 14px' }}>FABRIC SPEC</th>
              <th style={{ padding: '12px 14px' }}>METRES CHECKED</th>
              <th style={{ padding: '12px 14px' }}>DEFECT BREAKDOWN</th>
              <th style={{ padding: '12px 14px' }}>SCORE / 100M</th>
              <th style={{ padding: '12px 14px' }}>RESULT GRADE</th>
              <th style={{ padding: '12px 14px' }}>QC AUDITOR</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudits.map((a) => (
              <tr 
                key={a.id}
                style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                  {a.auditNumber}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 700 }}>{a.lotNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.rollNumber}</div>
                </td>
                <td style={{ padding: '14px', color: 'var(--text-dim)' }}>
                  {a.fabricSpec}
                </td>
                <td style={{ padding: '14px', fontWeight: 600 }}>
                  {a.inspectedMetres} m
                </td>
                <td style={{ padding: '14px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                    <span>Streak: {a.defectBreakdown.warpStreak}</span>
                    <span>Slub: {a.defectBreakdown.slub}</span>
                    <span>Hole: {a.defectBreakdown.hole}</span>
                    <span>Shade: {a.defectBreakdown.shadeVar}</span>
                  </div>
                </td>
                <td style={{ padding: '14px', fontWeight: 800, color: a.pointsPer100M <= 15 ? 'var(--emerald)' : 'var(--gold)' }}>
                  {a.pointsPer100M} pts
                </td>
                <td style={{ padding: '14px' }}>
                  <span className={a.result.includes('Grade A') ? 'badge badge-emerald' : a.result.includes('Grade B') ? 'badge badge-blue' : 'badge badge-rose'}>
                    {a.result}
                  </span>
                </td>
                <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {a.auditorName}
                </td>
                <td style={{ padding: '14px' }}>
                  <button
                    onClick={() => setSelectedAuditForTag(a)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    title="Print ASTM Fabric Roll Inspection Tag"
                  >
                    <Printer size={13} color="var(--blue-primary)" />
                    <span>Tag</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spectrophotometer Shade Test Modal */}
      {isSpectroModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSpectroModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--purple)" />
                <span>Datacolor Spectrophotometer Shade Test</span>
              </h3>
              <button onClick={() => setIsSpectroModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Production Dyeing Lot *</label>
                <input type="text" className="input-field" value={spectroLot} onChange={(e) => setSpectroLot(e.target.value)} />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="label">Measured Delta E (ΔE CMC 2:1)</label>
                  <input type="number" step="0.01" className="input-field" value={deltaE} onChange={(e) => {
                    const val = Number(e.target.value);
                    setDeltaE(val);
                    setSpectroStatus(val <= 0.8 ? 'Pass (Commercial Match)' : val <= 1.2 ? 'Borderline (Buyer Approval Needed)' : 'Fail (Shade Variation)');
                  }} />
                </div>
                <div>
                  <label className="label">Illuminant Standard</label>
                  <select className="input-field" defaultValue="D65 / 10 deg">
                    <option value="D65 / 10 deg">D65 Daylight (Standard)</option>
                    <option value="TL84 Store">TL84 Store Fluorescent</option>
                    <option value="Incandescent A">Incandescent A Light</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PASS/FAIL EVALUATION:</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: deltaE <= 0.8 ? 'var(--emerald)' : 'var(--gold)', marginTop: '2px' }}>
                  {spectroStatus}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsSpectroModalOpen(false)} className="btn btn-secondary">Close</button>
                <button type="button" onClick={() => { alert(`Spectro test of ΔE=${deltaE} certified into Lot #${spectroLot}.`); setIsSpectroModalOpen(false); }} className="btn btn-primary">
                  Certify Shade Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASTM 4-Point Roll Tag Modal */}
      {selectedAuditForTag && (
        <div className="modal-overlay" onClick={() => setSelectedAuditForTag(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} color="var(--emerald)" />
                <span>ASTM 4-Point Roll Inspection Tag</span>
              </h3>
              <button onClick={() => setSelectedAuditForTag(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ border: '2px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '18px', background: '#ffffff', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>{selectedAuditForTag.auditNumber}</span>
                <span className={selectedAuditForTag.result.includes('Grade A') ? 'badge badge-emerald' : 'badge badge-blue'}>{selectedAuditForTag.result}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Lot Number:</span> <strong>{selectedAuditForTag.lotNumber}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Roll Serial:</span> <strong>{selectedAuditForTag.rollNumber}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Inspected Metres:</span> <strong>{selectedAuditForTag.inspectedMetres} m</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Defect Score:</span> <strong>{selectedAuditForTag.pointsPer100M} pts / 100m</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Warp Streaks:</span> <strong>{selectedAuditForTag.defectBreakdown.warpStreak}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Holes / Drops:</span> <strong>{selectedAuditForTag.defectBreakdown.hole}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>QC Lead:</span> <strong>{selectedAuditForTag.auditorName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> <strong>23 Oct 2026</strong></div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setSelectedAuditForTag(null)} className="btn btn-secondary">Close</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Inspection Tag</span>
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
                  <FileCheck2 size={20} color="var(--blue-primary)" />
                  <span>Log ASTM 4-Point Fabric Inspection</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enter observed fabric defects to automatically calculate points/100m and quality grade
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Production Lot # *</label>
                  <select 
                    className="input-field"
                    value={lotNumber}
                    onChange={(e) => {
                      setLotNumber(e.target.value);
                      const selected = lots.find(l => l.lotNumber === e.target.value);
                      if (selected) setFabricSpec(selected.fabricSpec);
                    }}
                  >
                    {lots.map(l => (
                      <option key={l.id} value={l.lotNumber}>{l.lotNumber} ({l.clientName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Roll Serial # *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. ROLL-104"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Fabric Specification</label>
                <input type="text" className="input-field" value={fabricSpec} readOnly />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Inspected Length (Metres) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="50"
                    step="10"
                    value={inspectedMetres}
                    onChange={(e) => setInspectedMetres(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="label">QC Inspector Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Defect Point Counters */}
              <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                  ASTM 4-Point Defect Count Log
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warp Streaks</label>
                    <input type="number" min="0" className="input-field" value={warpStreak} onChange={(e) => setWarpStreak(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Yarn Slubs</label>
                    <input type="number" min="0" className="input-field" value={slub} onChange={(e) => setSlub(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pin Holes (x4)</label>
                    <input type="number" min="0" className="input-field" value={hole} onChange={(e) => setHole(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Shade Var (x2)</label>
                    <input type="number" min="0" className="input-field" value={shadeVar} onChange={(e) => setShadeVar(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Oil Stains</label>
                    <input type="number" min="0" className="input-field" value={oilStain} onChange={(e) => setOilStain(Number(e.target.value))} />
                  </div>
                </div>

                {/* Live Computed Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Computed ASTM Score: </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--blue-primary)' }}>{pointsPer100M} pts / 100m</strong>
                  </div>
                  <span className={gradeResult.includes('Grade A') ? 'badge badge-emerald' : gradeResult.includes('Grade B') ? 'badge badge-blue' : 'badge badge-rose'}>
                    {gradeResult}
                  </span>
                </div>
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
                  <span>Certify & Issue QC Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
