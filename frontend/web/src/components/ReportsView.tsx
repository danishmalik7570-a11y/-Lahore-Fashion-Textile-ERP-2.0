import React, { useState } from 'react';
import { useMillData } from '../context/MillDataContext';
import { 
  ProductionTrendChart, 
  StageDistributionDonut, 
  ShiftPerformanceBars, 
  QualityDefectTrendChart, 
  FinancialRevenueTrendChart 
} from './MillCharts';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { showToast } = useMillData();
  const [selectedRange, setSelectedRange] = useState('Month to Date');

  const handleExport = (format: string) => {
    showToast('Export Generated', `Executive Telemetry Report exported to ${format.toUpperCase()} successfully.`);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart3 size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Executive Analytics & Business Intelligence
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Multi-stage manufacturing yield analysis, yarn consumption ratios, loom uptime & financial snapshots
          </p>
        </div>

        {/* Date Filter & Export */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            {['Week to Date', 'Month to Date', 'Year to Date'].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                style={{
                  background: selectedRange === r ? 'var(--blue-primary)' : 'transparent',
                  color: selectedRange === r ? '#ffffff' : 'var(--text-dim)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => handleExport('pdf')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet size={14} />
            <span>Executive PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTHLY METRES WOVEN</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            1.14M <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Metres</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ↑ +8.4% above monthly plan
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>YARN TO FABRIC YIELD</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            96.8%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Minimal 3.2% spinning and sizing waste
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>GROSS REALIZED REVENUE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            PKR 48.6M
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Operating margin 31.6%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUALITY GRADE A RATIO</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            98.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ASTM D5430 certified
          </div>
        </div>
      </div>

      {/* Top Level Graphs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
        <ProductionTrendChart />
        <FinancialRevenueTrendChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <StageDistributionDonut />
        <ShiftPerformanceBars />
      </div>

      <QualityDefectTrendChart />

    </div>
  );
};
