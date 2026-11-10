import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, CheckCircle2 } from 'lucide-react';

export const ProductionTrendChart: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data7d = [
    { label: 'Mon', weaving: 32000, dyeing: 28500, target: 30000 },
    { label: 'Tue', weaving: 34500, dyeing: 31000, target: 30000 },
    { label: 'Wed', weaving: 31200, dyeing: 29800, target: 30000 },
    { label: 'Thu', weaving: 38450, dyeing: 34200, target: 32000 },
    { label: 'Fri', weaving: 39100, dyeing: 36000, target: 32000 },
    { label: 'Sat', weaving: 41200, dyeing: 38400, target: 35000 },
    { label: 'Sun', weaving: 36800, dyeing: 33500, target: 30000 },
  ];

  const maxVal = 45000;
  const width = 680;
  const height = 240;
  const padX = 45;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const getX = (idx: number) => padX + (idx / (data7d.length - 1)) * chartW;
  const getY = (val: number) => padY + chartH - (val / maxVal) * chartH;

  const weavingPoints = data7d.map((d, i) => `${getX(i)},${getY(d.weaving)}`).join(' ');
  const dyeingPoints = data7d.map((d, i) => `${getX(i)},${getY(d.dyeing)}`).join(' ');
  const weavingArea = `${getX(0)},${height - padY} ${weavingPoints} ${getX(data7d.length - 1)},${height - padY}`;

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--blue-primary)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
              Daily Loom Production vs Target
            </h3>
            <span className="badge badge-blue">METRES WOVEN</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time multi-loom output tracking across all active weave sheds
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
          {(['7d', '30d', '12m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? '#ffffff' : 'transparent',
                color: period === p ? 'var(--blue-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '540px' }}>
          <defs>
            <linearGradient id="weavingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dyeingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 15000, 30000, 45000].map((v, i) => {
            const y = getY(v);
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeDasharray={v === 30000 ? '4 4' : 'none'} />
                <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {v === 0 ? '0' : `${v / 1000}k`}
                </text>
              </g>
            );
          })}

          {/* Target indicator line label */}
          <text x={width - padX} y={getY(30000) - 6} textAnchor="end" fontSize="10" fontWeight="600" fill="#d97706">
            Daily Target (30k m)
          </text>

          {/* Shaded Area */}
          <polygon points={weavingArea} fill="url(#weavingGrad)" />

          {/* Lines */}
          <polyline fill="none" stroke="#0284c7" strokeWidth="2.5" points={dyeingPoints} strokeDasharray="3 3" />
          <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={weavingPoints} />

          {/* Data Points and Hover Triggers */}
          {data7d.map((d, i) => {
            const cx = getX(i);
            const cyWeave = getY(d.weaving);
            const isHovered = hoverIndex === i;

            return (
              <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cyWeave} r={isHovered ? 6 : 4} fill="#ffffff" stroke="#2563eb" strokeWidth={isHovered ? 3 : 2} />
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fontWeight={isHovered ? '700' : '500'} fill={isHovered ? '#2563eb' : '#64748b'}>
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Interactive Tooltip Card */}
          {hoverIndex !== null && (
            <g transform={`translate(${Math.min(getX(hoverIndex), width - 160)}, ${Math.max(getY(data7d[hoverIndex].weaving) - 65, 10)})`}>
              <rect width="140" height="54" rx="8" fill="#0f172a" fillOpacity="0.95" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
              <text x="12" y="18" fill="#93c5fd" fontSize="11" fontWeight="700">
                {data7d[hoverIndex].label} Output
              </text>
              <text x="12" y="34" fill="#ffffff" fontSize="12" fontWeight="700">
                Woven: {data7d[hoverIndex].weaving.toLocaleString()} m
              </text>
              <text x="12" y="47" fill="#38bdf8" fontSize="10">
                Dyed: {data7d[hoverIndex].dyeing.toLocaleString()} m
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Chart Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '4px', background: '#2563eb', borderRadius: '2px' }} />
          <span>Weaving Production</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', background: '#0284c7', borderTop: '2px dashed #0284c7' }} />
          <span>Dyeing Volume</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', background: '#d97706', borderTop: '2px dashed #d97706' }} />
          <span>Target Threshold</span>
        </div>
      </div>
    </div>
  );
};

export const StageDistributionDonut: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(1);

  const stagesData = [
    { name: 'Yarn Bobbins', percent: 14, color: '#f59e0b', volume: '14,200 kg' },
    { name: 'Weaving Sheds', percent: 28, color: '#2563eb', volume: '38,400 m' },
    { name: 'Dyeing & Wet', percent: 20, color: '#0284c7', volume: '24,600 m' },
    { name: 'Laser Cutting', percent: 16, color: '#7c3aed', volume: '16,500 pcs' },
    { name: 'Stitching Lines', percent: 14, color: '#ec4899', volume: '14,800 pcs' },
    { name: 'QC & Packaging', percent: 8, color: '#16a34a', volume: '12,400 pcs' },
  ];

  const size = 180;
  const strokeW = 24;
  const radius = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={18} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>Stage Volume Share</h3>
        </div>
        <span className="badge badge-emerald">6 ACTIVE SECTORS</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', flex: 1 }}>
        {/* Donut SVG */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {stagesData.map((s, idx) => {
              const strokeDashoffset = circumference - (s.percent / 100) * circumference;
              const rotation = (accumulatedPercent / 100) * 360 - 90;
              accumulatedPercent += s.percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={activeStage === idx ? strokeW + 4 : strokeW}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setActiveStage(idx)}
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stagesData[activeStage].percent}%
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {stagesData[activeStage].name}
            </span>
          </div>
        </div>

        {/* Interactive Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
          {stagesData.map((s, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveStage(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: activeStage === idx ? 'var(--bg-subtle)' : 'transparent',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: activeStage === idx ? 700 : 500, color: 'var(--text-dim)' }}>
                  {s.name}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {s.volume}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ShiftPerformanceBars: React.FC = () => {
  const shifts = [
    { shift: 'Shift A (08:00 - 16:00)', target: 15000, actual: 16400, eff: 109, workers: 120 },
    { shift: 'Shift B (16:00 - 00:00)', target: 12000, actual: 12850, eff: 107, workers: 64 },
    { shift: 'Shift C (00:00 - 08:00)', target: 8000, actual: 9200, eff: 115, workers: 42 },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>
            Tri-Shift Production Comparison
          </h3>
        </div>
        <span className="badge badge-blue">ALL 3 SHIFTS OVER TARGET</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {shifts.map((s, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.shift}</span>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                {s.actual.toLocaleString()} m ({s.eff}% of quota)
              </span>
            </div>

            <div style={{
              width: '100%',
              height: '10px',
              background: '#e2e8f0',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              display: 'flex',
            }}>
              <div style={{
                width: `${Math.min((s.actual / 18000) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.8s ease',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Target: {s.target.toLocaleString()} m</span>
              <span>{s.workers} active operators</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QualityDefectTrendChart: React.FC = () => {
  const weeks = [
    { label: 'Wk 39', passRate: 97.2, defectPoints: 12.4 },
    { label: 'Wk 40', passRate: 96.8, defectPoints: 14.1 },
    { label: 'Wk 41', passRate: 98.1, defectPoints: 9.8 },
    { label: 'Wk 42', passRate: 98.4, defectPoints: 8.5 },
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="var(--emerald)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>
            ASTM 4-Point Quality Pass Rate
          </h3>
        </div>
        <span className="badge badge-emerald">98.4% PASS (GRADE A)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
        {weeks.map((w, idx) => (
          <div key={idx} style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{w.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)', margin: '4px 0' }}>{w.passRate}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 600 }}>{w.defectPoints} pts/100m</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FinancialRevenueTrendChart: React.FC = () => {
  const months = [
    { m: 'May', rev: 41.2, cost: 29.8 },
    { m: 'Jun', rev: 44.5, cost: 31.0 },
    { m: 'Jul', rev: 39.8, cost: 28.5 },
    { m: 'Aug', rev: 46.2, cost: 32.1 },
    { m: 'Sep', rev: 45.9, cost: 31.8 },
    { m: 'Oct', rev: 48.6, cost: 33.2 },
  ];

  const maxVal = 55;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--blue-primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>
            Monthly Mill Revenue vs Operating Cost (PKR Millions)
          </h3>
        </div>
        <span className="badge badge-blue">OCT: PKR 48.6M</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
        {months.map((d, i) => {
          const revHeight = (d.rev / maxVal) * 130;
          const costHeight = (d.cost / maxVal) * 130;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <div
                  title={`Revenue: PKR ${d.rev}M`}
                  style={{
                    width: '18px',
                    height: `${revHeight}px`,
                    background: 'linear-gradient(180deg, #2563eb, #1d4ed8)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                />
                <div
                  title={`Cost: PKR ${d.cost}M`}
                  style={{
                    width: '18px',
                    height: `${costHeight}px`,
                    background: '#94a3b8',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{d.m}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Gross Invoiced Billing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#94a3b8', borderRadius: '2px' }} />
          <span style={{ color: '#64748b', fontWeight: 500 }}>Raw Yarn, Power & Wages</span>
        </div>
      </div>
    </div>
  );
};

