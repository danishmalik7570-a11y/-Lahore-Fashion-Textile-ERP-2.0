import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMillData } from '../context/MillDataContext';
import { ProductionTrendChart, StageDistributionDonut, ShiftPerformanceBars } from './MillCharts';
import { 
  TrendingUp, 
  Layers, 
  Users, 
  DollarSign, 
  QrCode, 
  PlusCircle, 
  FileCheck2, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import type { ModuleKey } from '../types';

interface DashboardViewProps {
  onNavigate?: (module: ModuleKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, activeBranch } = useAuth();
  const { lots, orders } = useMillData();
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>('all');

  const stages = [
    { id: 'yarn', name: 'Yarn Bobbin', code: 'STG-01', lots: 6, volume: '14,200 kg', eff: 98, color: '#2563eb', status: 'Running' },
    { id: 'weaving', name: 'Weaving Shed', code: 'STG-02', lots: 9, volume: '38,400 m', eff: 94, color: '#0284c7', status: 'Optimal' },
    { id: 'grey', name: 'Grey Inspection', code: 'STG-03', lots: 4, volume: '19,800 m', eff: 95, color: '#16a34a', status: 'Running' },
    { id: 'dyeing', name: 'Dyeing Jet House', code: 'STG-04', lots: 7, volume: '24,600 m', eff: 88, color: '#7c3aed', status: 'Busy' },
    { id: 'printing', name: 'Rotary Print', code: 'STG-05', lots: 3, volume: '11,200 m', eff: 91, color: '#0d9488', status: 'Running' },
    { id: 'cutting', name: 'Laser Cutting', code: 'STG-06', lots: 5, volume: '16,500 pcs', eff: 96, color: '#4f46e5', status: 'Optimal' },
    { id: 'stitching', name: 'Stitching Lines', code: 'STG-07', lots: 8, volume: '14,800 pcs', eff: 89, color: '#d97706', status: 'Active' },
    { id: 'packing', name: 'QC & Packaging', code: 'STG-08', lots: 4, volume: '12,400 pcs', eff: 97, color: '#059669', status: 'Running' },
    { id: 'delivery', name: 'Export Dispatch', code: 'STG-09', lots: 2, volume: '9,800 pcs', eff: 100, color: '#1d4ed8', status: 'Ready' },
  ];

  const totalContractValue = orders.reduce((sum, o) => sum + o.totalAmountPKR, 0);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Welcome Banner - Crisp White & Blue */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald" style={{ fontWeight: 700 }}>MILL ONLINE</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{activeBranch.name} • Live Factory Telemetry</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '640px' }}>
            Mill operations running with <strong style={{ color: 'var(--blue-primary)' }}>94.2% overall loom efficiency</strong>. {lots.length} active manufacturing lots currently progressing across yarn store, weaving, knitting, grey fabric, dyeing, printing, cutting, stitching, finishing & packing, and delivery.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('orders')}
          >
            <PlusCircle size={16} />
            <span>Book Buyer Order</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate && onNavigate('production')}
          >
            <QrCode size={16} color="var(--blue-primary)" />
            <span>Issue Lot QR</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate && onNavigate('quality')}
          >
            <FileCheck2 size={16} />
            <span>4-Point QC Audit</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px',
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S PRODUCTION</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
                38,450 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Metres</span>
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={22} color="var(--blue-primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>↑ +12.4%</span>
            <span style={{ color: 'var(--text-muted)' }}>vs daily target (35,000 m)</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE MANUFACTURING LOTS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
                {lots.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Batches</span>
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={22} color="var(--blue-sky)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.8rem' }}>
            <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>9 STAGES LIVE</span>
            <span style={{ color: 'var(--text-muted)' }}>0 Critical bottlenecks</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FACTORY FLOOR OPERATORS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
                184 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Present</span>
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(217, 119, 6, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={22} color="var(--gold)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>96.8%</span>
            <span style={{ color: 'var(--text-muted)' }}>biometric shift turnout</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTHLY CONTRACT VALUE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
                PKR {(totalContractValue / 1000000).toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>M</span>
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={22} color="var(--blue-primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>16 Major Buyers</span>
            <span style={{ color: 'var(--text-muted)' }}>Khaadi, Sapphire, J.</span>
          </div>
        </div>
      </div>

      {/* TOP-LEVEL INTERACTIVE GRAPHS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        <ProductionTrendChart />
        <StageDistributionDonut />
      </div>

      <ShiftPerformanceBars />

      {/* Production Pipeline Flow */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Textile Manufacturing Pipeline</span>
              <span className="badge badge-blue">Vertical Integration</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time progression from raw yarn bobbins to packaged garment export
            </p>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Updated in real-time via WebSocket
          </div>
        </div>

        {/* 9 Stages Horizontal Flow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}>
          {stages.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedPipelineStage(s.id)}
              style={{
                background: selectedPipelineStage === s.id ? 'var(--blue-light)' : '#ffffff',
                border: selectedPipelineStage === s.id ? '2px solid var(--blue-primary)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.code}</span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: s.color,
                }} />
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {s.name}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>{s.lots} Lots</strong> • {s.volume}
              </div>

              {/* Efficiency Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Efficiency</span>
                  <strong>{s.eff}%</strong>
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${s.eff}%`,
                    height: '100%',
                    background: s.color,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Manufacturing Lots Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
              Live Production Lots & QR Scan Feed
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Current manufacturing batches scanned by floor supervisors and operators
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => onNavigate && onNavigate('production')}
          >
            <span>View All Lots</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                <th style={{ padding: '10px 14px' }}>LOT IDENTIFIER</th>
                <th style={{ padding: '10px 14px' }}>BUYER / CLIENT</th>
                <th style={{ padding: '10px 14px' }}>FABRIC SPEC & ITEM</th>
                <th style={{ padding: '10px 14px' }}>CURRENT STAGE</th>
                <th style={{ padding: '10px 14px' }}>TARGET METRES</th>
                <th style={{ padding: '10px 14px' }}>MACHINE #</th>
                <th style={{ padding: '10px 14px' }}>STATUS</th>
                <th style={{ padding: '10px 14px' }}>LAST SCAN</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((row) => (
                <tr 
                  key={row.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <QrCode size={14} color="var(--blue-primary)" />
                      <span>{row.lotNumber}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{row.clientName}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>{row.fabricSpec}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-blue">
                      {row.stageName}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{row.targetMetres.toLocaleString()} m</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{row.loomNumber}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={row.status === 'Optimal' ? 'badge badge-emerald' : 'badge badge-blue'}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{row.lastScanTime}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
