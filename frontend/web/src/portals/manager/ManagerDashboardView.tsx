import React, { useState } from 'react';
import {
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Users,
  CheckSquare,
  Search,
  Plus,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const ManagerDashboardView: React.FC = () => {

  const [activeDept, setActiveDept] = useState<string>('all');
  const [meetingMode, setMeetingMode] = useState<boolean>(false);

  // Delayed lots table state with real action handlers
  const [delayedLots, setDelayedLots] = useState([
    {
      lotNumber: 'LOT-2026-088',
      buyer: 'Khaadi Textiles',
      style: 'Cotton Lawn Digital 3pc',
      targetQty: '12,500 m',
      currentStage: 'Printing',
      delayedDays: 3,
      reason: 'Cylinder engraving shade mismatch',
      actionTaken: 'Normal',
    },
    {
      lotNumber: 'LOT-2026-092',
      buyer: 'Gul Ahmed',
      style: 'Oxford Twill Trouser',
      targetQty: '8,200 pcs',
      currentStage: 'Cutting',
      delayedDays: 2,
      reason: 'Fabric shrinkage lab re-test',
      actionTaken: 'Normal',
    },
    {
      lotNumber: 'LOT-2026-095',
      buyer: 'Sapphire Retail',
      style: 'Summer Voile Dupatta',
      targetQty: '15,000 m',
      currentStage: 'Weaving',
      delayedDays: 1,
      reason: 'Yarn 60/1 combed count delay',
      actionTaken: 'Normal',
    },
  ]);

  const [approvals, setApprovals] = useState([
    { id: 'ap-1', type: 'Stock Adjustment', title: 'Grey Fabric 450m Defect Write-off', dept: 'Weaving', requester: 'Irfan (Loom Sup)' },
    { id: 'ap-2', type: 'Overtime Batch', title: '14 Stitchers 2h Extension', dept: 'Stitching Line 4', requester: 'Babar (Line Lead)' },
    { id: 'ap-3', type: 'Inter-Mill Transfer', title: '5,000 kg Combed Yarn to FSD Weaving', dept: 'Yarn Store', requester: 'Tariq (Store Incharge)' },
  ]);

  const handleExpedite = (lotNumber: string) => {
    setDelayedLots((prev) =>
      prev.map((lot) => (lot.lotNumber === lotNumber ? { ...lot, actionTaken: 'EXPEDITED' } : lot))
    );
    alert(`Priority expedited for ${lotNumber}. Supervisors notified via Floor Kiosk & WhatsApp.`);
  };

  const handleApproveItem = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Header & Quick Actions Bar ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mill Command Center
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Live Telemetry Active
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Operations & Production Control
          </h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => alert('Search Lot Dialog (Scan or Type)')}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search size={16} /> Open Lot (Scan)
          </button>

          <button
            onClick={() => alert('Create New Production Lot')}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> Create Lot
          </button>

          <button
            onClick={() => setMeetingMode(!meetingMode)}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: meetingMode ? '#0F172A' : '#1E40AF',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
            }}
          >
            {meetingMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {meetingMode ? 'Exit Meeting Mode' : 'Run Daily Meeting Pack'}
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI Strip (8 Operations Metrics) ────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
        }}
      >
        {[
          { label: 'Active Orders', value: '42', sub: '18 in high rush', icon: Package, color: '#3B82F6' },
          { label: 'Lots in Production', value: '118', sub: 'Across 9 depts', icon: Layers, color: '#8B5CF6' },
          { label: 'Output vs Target', value: '96.4%', sub: '48,200m / 50k', icon: TrendingUp, color: '#10B981' },
          { label: 'Delayed Lots', value: '3', sub: 'Needs escalation', icon: AlertTriangle, color: '#EF4444' },
          { label: 'Overall OEE', value: '88.5%', sub: 'Target 85.0%', icon: Cpu, color: '#06B6D4' },
          { label: 'Quality RFT Pass', value: '98.2%', sub: 'AQL 2.5 pass', icon: CheckCircle2, color: '#10B981' },
          { label: 'Floor Attendance', value: '94.2%', sub: '1,176 present', icon: Users, color: '#0D9488' },
          { label: 'Pending Approvals', value: approvals.length.toString(), sub: 'Stock / OT / batch', icon: CheckSquare, color: '#F59E0B' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{kpi.label}</span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: `${kpi.color}14`,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <kpi.icon size={15} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Mill Flow (WIP Sankey Representation) & Department Health Tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Mill Flow WIP Stepper / Pipeline */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Mill Flow WIP Pipeline (Yarn → Dispatch)
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                Active lots moving through production gates with yield & wastage metrics
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>Consolidated Flow</span>
          </div>

          {/* Stepper with WIP and Yield */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { stage: '1. Yarn & Weaving', wip: '18 Lots', yield: '98.5%', status: 'NORMAL' },
              { stage: '2. Greige & Dyeing', wip: '24 Lots', yield: '96.2%', status: 'NORMAL' },
              { stage: '3. Printing', wip: '14 Lots', yield: '95.0%', status: 'BOTTLENECK' },
              { stage: '4. Cutting & Stitch', wip: '42 Lots', yield: '97.8%', status: 'NORMAL' },
              { stage: '5. Pack & Dispatch', wip: '20 Lots', yield: '99.1%', status: 'NORMAL' },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: step.status === 'BOTTLENECK' ? '#FEF2F2' : '#F8FAFC',
                  border: step.status === 'BOTTLENECK' ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: step.status === 'BOTTLENECK' ? '#DC2626' : '#1E40AF' }}>
                  {step.stage}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                  {step.wip}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Yield: <strong style={{ color: '#0F172A' }}>{step.yield}</strong>
                </div>
                {step.status === 'BOTTLENECK' && (
                  <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 700, marginTop: '6px' }}>
                    ⚠ WIP Build-up
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Department Health Tiles (Scope Switcher) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Department Health Check
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Click to filter scope</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { id: 'weaving', name: 'Weaving', oee: '92%', status: 'Good' },
              { id: 'dyeing', name: 'Dyeing', oee: '87%', status: 'Good' },
              { id: 'printing', name: 'Printing', oee: '76%', status: 'Attention' },
              { id: 'cutting', name: 'Cutting', oee: '91%', status: 'Good' },
              { id: 'stitching', name: 'Stitching', oee: '89%', status: 'Good' },
              { id: 'finishing', name: 'Finishing', oee: '94%', status: 'Good' },
            ].map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveDept(activeDept === dept.id ? 'all' : dept.id)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: activeDept === dept.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: activeDept === dept.id ? '#EFF6FF' : '#F8FAFC',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{dept.name}</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: dept.status === 'Attention' ? '#EF4444' : '#10B981', marginTop: '2px' }}>
                  {dept.oee} OEE
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Delayed Lots Table & Escalation Actions ─────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Delayed Lots & Critical Escalations ({delayedLots.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
              Orders currently tracking behind promised delivery date
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left', color: '#64748B' }}>
                <th style={{ padding: '10px 12px' }}>Lot Number</th>
                <th style={{ padding: '10px 12px' }}>Buyer & Style</th>
                <th style={{ padding: '10px 12px' }}>Target Quantity</th>
                <th style={{ padding: '10px 12px' }}>Current Stage</th>
                <th style={{ padding: '10px 12px' }}>Delay (Days)</th>
                <th style={{ padding: '10px 12px' }}>Root Cause</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {delayedLots.map((lot) => (
                <tr key={lot.lotNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#1E40AF' }}>{lot.lotNumber}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{lot.buyer}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{lot.style}</div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{lot.targetQty}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {lot.currentStage}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#FEF2F2', color: '#EF4444', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      +{lot.delayedDays} days
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#64748B' }}>{lot.reason}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {lot.actionTaken === 'EXPEDITED' ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>✓ Expedited</span>
                    ) : (
                      <button
                        onClick={() => handleExpedite(lot.lotNumber)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Expedite Priority
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 4: Operations Approvals Inbox ─────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Operations Approvals Inbox ({approvals.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Floor Escalations</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {approvals.map((appr) => (
            <div
              key={appr.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                  {appr.type}
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {appr.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {appr.dept} • Requested by: {appr.requester}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApproveItem(appr.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproveItem(appr.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {approvals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
              ✓ All operations approvals cleared!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
