import React, { useState } from 'react';
import { usePortal } from '../PortalContext';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Briefcase,
  TrendingDown,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';

export const HrDashboardView: React.FC = () => {
  const { requestStepUpAuth } = usePortal();

  // Pending Actions Mock State with real inline approval actions
  const [pendingLeaves, setPendingLeaves] = useState([
    { id: 'lv-1', name: 'Rashid Mahmood', dept: 'Stitching', type: 'Casual Leave', dates: '28-29 Oct (2d)', status: 'PENDING' },
    { id: 'lv-2', name: 'Zainab Bibi', dept: 'Quality / Lab', type: 'Medical Leave', dates: '28 Oct (1d)', status: 'PENDING' },
  ]);

  const [pendingOT, setPendingOT] = useState([
    { id: 'ot-1', dept: 'Weaving Unit 2', count: '14 Workers', hours: '28 hrs total', reason: 'Order LOT-2026-088 delivery rush', status: 'PENDING' },
    { id: 'ot-2', dept: 'Dyeing Section', count: '6 Workers', hours: '12 hrs total', reason: 'Stenter continuous run', status: 'PENDING' },
  ]);

  const [payrollStatus, setPayrollStatus] = useState<'review' | 'step_up_pending' | 'approved'>('review');

  const handleApproveLeave = (id: string) => {
    setPendingLeaves((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApproveOT = (id: string) => {
    setPendingOT((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRunPayroll = () => {
    requestStepUpAuth('payroll_approval_october_2026', () => {
      setPayrollStatus('approved');
      alert('October 2026 Payroll Cycle APPROVED & Bank File generated for HBL Corporate Banking.');
    });
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
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              HR Command Center
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Live Biometric Connected
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            People & Payroll Operations
          </h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => alert('Add Employee Dialog')}
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
            <Plus size={16} /> Add Employee
          </button>

          <button
            onClick={() => alert('Generating EOBI Form 5A & 5B...')}
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
            <FileSpreadsheet size={16} /> EOBI Registers
          </button>

          <button
            onClick={handleRunPayroll}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <CreditCard size={16} />
            {payrollStatus === 'approved' ? 'Payroll Locked & Approved' : 'Run Payroll Cycle (Step-Up)'}
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI Strip (8 Primary Cards) ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
        }}
      >
        {[
          { label: 'Total Headcount', value: '1,248', sub: '+12 this month', icon: Users, color: '#3B82F6' },
          { label: 'Present Today', value: '94.2%', sub: '1,176 on floor', icon: UserCheck, color: '#10B981' },
          { label: 'Absent Today', value: '58', sub: '34 unplanned', icon: UserX, color: '#EF4444' },
          { label: 'On Leave', value: '14', sub: 'Approved leaves', icon: Calendar, color: '#F59E0B' },
          { label: 'Late Punch', value: '23', sub: 'Grace threshold', icon: Clock, color: '#8B5CF6' },
          { label: 'Open Positions', value: '18', sub: 'Stitching expansion', icon: Briefcase, color: '#06B6D4' },
          { label: '12m Attrition', value: '3.8%', sub: 'Low industry avg', icon: TrendingDown, color: '#10B981' },
          { label: 'MTD Payroll', value: 'PKR 18.4M', sub: 'Est. 24.2M gross', icon: CreditCard, color: '#0D9488' },
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

      {/* ── Row 2: Today's Attendance Board & Monthly Heat Calendar ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Today's Department Attendance Board */}
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
                Today's Attendance Board by Department
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                Biometric punch data synced across Gate 1 (Yarn), Gate 2 (Main), Gate 3 (Garments)
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D9488' }}>Live 08:30 Shift</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { dept: 'Stitching Lines', present: 482, total: 510, pct: 94.5, absent: 28 },
              { dept: 'Weaving Unit', present: 212, total: 220, pct: 96.3, absent: 8 },
              { dept: 'Dyeing & Finish', present: 148, total: 155, pct: 95.4, absent: 7 },
              { dept: 'Cutting Section', present: 96, total: 104, pct: 92.3, absent: 8 },
              { dept: 'Printing & Lab', present: 64, total: 68, pct: 94.1, absent: 4 },
              { dept: 'Packing & Dispatch', present: 174, total: 191, pct: 91.0, absent: 17 },
            ].map((d, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{d.dept}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: d.pct >= 94 ? '#10B981' : '#F59E0B' }}>
                    {d.pct}%
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
                  {d.present} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>/ {d.total}</span>
                </div>
                {/* Mini progress bar */}
                <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${d.pct}%`, height: '100%', backgroundColor: d.pct >= 94 ? '#10B981' : '#F59E0B' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', fontWeight: 500 }}>
                  {d.absent} absent drill
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Attendance Heat Calendar */}
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
              Attendance Heat Calendar (Oct)
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Avg 93.8%</span>
          </div>

          <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
            Factory-wide shift presence trends across all 27 working days this month.
          </p>

          {/* Heat map grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {Array.from({ length: 28 }).map((_, idx) => {
              const day = idx + 1;
              const isSunday = day % 7 === 0;
              const rate = isSunday ? 0 : 90 + ((day * 7) % 9);
              const color = isSunday
                ? '#F1F5F9'
                : rate >= 95
                ? '#0D9488'
                : rate >= 92
                ? '#2DD4BF'
                : '#99F6E4';

              return (
                <div
                  key={idx}
                  title={`Day ${day}: ${isSunday ? 'Off-day' : `${rate}% presence`}`}
                  style={{
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isSunday ? '#94A3B8' : rate >= 95 ? '#FFFFFF' : '#0F766E',
                    cursor: 'pointer',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: '#64748B' }}>
            <span>&lt; 90% (Low)</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#99F6E4' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2DD4BF' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#0D9488' }} />
            </div>
            <span>&gt; 95% (High)</span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Pending Actions Center & Payroll Cycle Tracker ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Pending Actions Center */}
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
              Pending HR Approvals ({pendingLeaves.length + pendingOT.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#0D9488', fontWeight: 600 }}>Approve All</span>
          </div>

          {/* Leave approvals list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
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
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{leave.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {leave.dept} • {leave.type} ({leave.dates})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleApproveLeave(leave.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleApproveLeave(leave.id)}
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

            {/* Overtime approvals */}
            {pendingOT.map((ot) => (
              <div
                key={ot.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FEF3C7',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                    Overtime Batch: {ot.dept}
                  </div>
                  <div style={{ fontSize: '11px', color: '#B45309' }}>
                    {ot.count} • {ot.hours} — {ot.reason}
                  </div>
                </div>

                <button
                  onClick={() => handleApproveOT(ot.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={14} /> Authorize OT
                </button>
              </div>
            ))}

            {pendingLeaves.length === 0 && pendingOT.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                ✓ All pending approvals up to date!
              </div>
            )}
          </div>
        </div>

        {/* Payroll Cycle Tracker */}
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
              October Payroll Cycle Tracker
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#FEF2F2', color: '#EF4444', padding: '2px 8px', borderRadius: '10px' }}>
              4 Days to Cutoff
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { step: '1. Biometric Attendance Locked', status: 'DONE', date: '26 Oct 23:59' },
              { step: '2. Piece-Rate Output Reconciled', status: 'DONE', date: '27 Oct 14:00' },
              { step: '3. Advances & Deductions Checked', status: 'ACTIVE', date: 'In Progress (2 flags)' },
              { step: '4. Executive Approval (Step-Up)', status: payrollStatus === 'approved' ? 'DONE' : 'PENDING', date: 'Awaiting HR Lead' },
              { step: '5. HBL Bank File Dispatched', status: payrollStatus === 'approved' ? 'DONE' : 'PENDING', date: 'Scheduled 31 Oct' },
            ].map((st, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: st.status === 'DONE' ? '#10B981' : st.status === 'ACTIVE' ? '#F59E0B' : '#E2E8F0',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {st.status === 'DONE' ? '✓' : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{st.step}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{st.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={handleRunPayroll}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: payrollStatus === 'approved' ? '#10B981' : '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={16} />
              {payrollStatus === 'approved' ? 'Payroll Signed & Verified' : 'Trigger Step-Up & Approve Payroll'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 4: Labour Mix & Factory Safety Banner ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}
        >
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
            Labour Mix: Permanent vs Thekedar (Contract)
          </h4>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0D9488' }}>884</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Permanent Staff (71%)</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}>364</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Thekedar Teams (29%)</div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0F766E',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={28} color="#5EEAD4" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#99F6E4', textTransform: 'uppercase' }}>
              Safety & Compliance Milestone
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>142 Days Without Lost Time Injury</div>
            <div style={{ fontSize: '12px', color: '#CCFBF1' }}>Factory Inspection Ready • ILO Standard Grade A</div>
          </div>
        </div>
      </div>
    </div>
  );
};
