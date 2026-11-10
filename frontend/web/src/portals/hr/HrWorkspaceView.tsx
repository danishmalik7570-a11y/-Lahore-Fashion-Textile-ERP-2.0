import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { LabourView } from '../../components/LabourView';
import { HrDashboardView } from './HrDashboardView';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Plus,
} from 'lucide-react';

interface HrWorkspaceViewProps {
  initialTab?: string;
  onNavigateLetters?: () => void;
}

export const HrWorkspaceView: React.FC<HrWorkspaceViewProps> = ({
  initialTab = 'hr-overview',
  onNavigateLetters,
}) => {
  const { user } = useAuth();
  const hrNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'hr')!;
  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [activeSubPageId, setActiveSubPageId] = useState<string | undefined>(undefined);

  const handleTabChange = (tabId: string, subPageId?: string) => {
    setActiveTabId(tabId);
    setActiveSubPageId(subPageId);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'act-add-emp',
      label: '+ Add Employee',
      primary: true,
      onClick: () => setActiveTabId('hr-employees'),
    },
    {
      id: 'act-run-payroll',
      label: 'Run Payroll',
      onClick: () => setActiveTabId('hr-payroll'),
    },
    {
      id: 'act-eobi',
      label: 'EOBI Returns',
      onClick: () => setActiveTabId('hr-compliance'),
    },
  ];

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'hr-overview':
        return <HrDashboardView />;

      case 'hr-employees':
        return <LabourView initialTab="workers" />;

      case 'hr-attendance':
        return <LabourView initialTab="attendance" />;

      case 'hr-leave':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Leave Management & Balances
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Statutory leave allocations under West Pakistan Industrial & Commercial Employment Ordinance.
                </p>
              </div>
              <button
                onClick={() => alert('New Leave Application Modal')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Apply Leave
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { title: 'Annual Leave Balance', value: '14 Days / Yr', sub: 'Mandatory paid annual leave' },
                { title: 'Casual / Sick Leave', value: '10 + 16 Days', sub: 'With 100% wage entitlement' },
                { title: 'Pending Approval', value: '3 Requests', sub: 'Requiring HR Head review' },
                { title: 'Festival Holidays', value: '11 Days', sub: 'Gazetted holidays calendar' },
              ].map((k, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{k.title}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '6px 0 2px 0' }}>
                    {k.value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px 0', color: '#0F172A' }}>
                Active Leave Register & Requests
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px 12px' }}>Employee</th>
                    <th style={{ padding: '8px 12px' }}>Department</th>
                    <th style={{ padding: '8px 12px' }}>Leave Type</th>
                    <th style={{ padding: '8px 12px' }}>Duration</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Muhammad Rizwan', code: 'LF-104', dept: 'Weaving', type: 'Annual Paid', dates: '04 Nov - 08 Nov (5d)', status: 'Pending Approval' },
                    { name: 'Kashif Ali', code: 'LF-211', dept: 'Dyeing Section', type: 'Sick Leave', dates: '02 Nov - 03 Nov (2d)', status: 'Approved' },
                    { name: 'Tahir Shah', code: 'LF-382', dept: 'Stitching Line 4', type: 'Casual Leave', dates: '01 Nov (1d)', status: 'Approved' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>
                        {row.name} <span style={{ color: '#64748B', fontWeight: 400 }}>({row.code})</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{row.dept}</td>
                      <td style={{ padding: '10px 12px' }}>{row.type}</td>
                      <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.dates}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: row.status === 'Approved' ? '#DEF7EC' : '#FEF3C7',
                            color: row.status === 'Approved' ? '#03543F' : '#92400E',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => alert(`Review request for ${row.name}`)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'hr-payroll':
        return <LabourView initialTab="payroll" />;

      case 'hr-advances':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Salary Advances & Loan Recoveries
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Track employee salary advances, monthly deductions, emergency funds, and penalty fines.
                </p>
              </div>
              <button
                onClick={() => alert('Issue New Salary Advance')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> New Advance
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Active Advances Total</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '6px 0 2px 0' }}>PKR 345,000</div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Deducted automatically on payroll run</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Monthly Recoveries (Nov)</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '6px 0 2px 0' }}>PKR 78,500</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>42 employees enrolled</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pending Advance Requests</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#D97706', margin: '6px 0 2px 0' }}>4 Requests</div>
                <div style={{ fontSize: '11px', color: '#D97706' }}>Awaiting HR Head approval</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px 0', color: '#0F172A' }}>
                Advance & Loan Register
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px 12px' }}>Employee</th>
                    <th style={{ padding: '8px 12px' }}>Total Loan</th>
                    <th style={{ padding: '8px 12px' }}>Monthly Deduction</th>
                    <th style={{ padding: '8px 12px' }}>Remaining Balance</th>
                    <th style={{ padding: '8px 12px' }}>Approval Date</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Sajid Mehmood (LF-108)', total: 'PKR 40,000', monthly: 'PKR 8,000', balance: 'PKR 16,000', date: '15 Aug 2026', status: 'In Recovery' },
                    { name: 'Imran Ashraf (LF-231)', total: 'PKR 25,000', monthly: 'PKR 5,000', balance: 'PKR 10,000', date: '01 Sep 2026', status: 'In Recovery' },
                    { name: 'Bilal Hassan (LF-305)', total: 'PKR 50,000', monthly: 'PKR 10,000', balance: 'PKR 50,000', date: '28 Oct 2026', status: 'Pending Approval' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '10px 12px' }}>{row.total}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{row.monthly}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{row.balance}</td>
                      <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: row.status === 'In Recovery' ? '#DEF7EC' : '#FEF3C7',
                            color: row.status === 'In Recovery' ? '#03543F' : '#92400E',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'hr-contractors':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Contractor Management (Thekedar & Third-Party Labour)
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Manage third-party contractors, daily headcounts, piece-rate billing, and statutory tax deductions.
                </p>
              </div>
              <button
                onClick={() => alert('Add New Contractor')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Add Contractor
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { title: 'Registered Contractors', val: '6 Thekedars', sub: 'Active master agreements' },
                { title: 'Contract Headcount Today', val: '84 Workers', sub: 'Stitching & Packing floors' },
                { title: 'Pending Bills', val: 'PKR 420,000', sub: 'Fortnightly billing verification' },
              ].map((c, i) => (
                <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '4px 0' }}>{c.val}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px 0', color: '#0F172A' }}>
                Contractor Master List
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px 12px' }}>Contractor Name</th>
                    <th style={{ padding: '8px 12px' }}>Assigned Section</th>
                    <th style={{ padding: '8px 12px' }}>Headcount Cap</th>
                    <th style={{ padding: '8px 12px' }}>Billing Rate</th>
                    <th style={{ padding: '8px 12px' }}>NTN / PRA Status</th>
                    <th style={{ padding: '8px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Al-Madina Stitching Services', section: 'Stitching Line 3 & 4', cap: '50 Workers', rate: 'Piece-rate (PKR 42/unit)', tax: 'Active Withholding (4%)' },
                    { name: 'Usman Finishing Crew', section: 'Finishing & Cartoning', cap: '25 Workers', rate: 'Daily (PKR 1,500/head)', tax: 'PRA Registered' },
                    { name: 'Bismillah Loading Team', section: 'Dispatch & Godown', cap: '15 Workers', rate: 'Piece-rate (PKR 12/bale)', tax: 'Active' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{row.section}</td>
                      <td style={{ padding: '10px 12px' }}>{row.cap}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.rate}</td>
                      <td style={{ padding: '10px 12px', color: '#16A34A', fontWeight: 600 }}>{row.tax}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => alert(`View ${row.name} ledger`)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'hr-compliance':
        return <LabourView initialTab="compliance" />;

      case 'hr-letters':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Letters & Official Forms (Format Builder)
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Generate and print formal appointment letters, warning letters, salary certificates, and experience letters.
                </p>
              </div>
              {onNavigateLetters && (
                <button
                  onClick={onNavigateLetters}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Open Format Builder
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { title: 'Standard Appointment Letter', desc: 'Compliant with Punjab Industrial Relations Act', code: 'DOC-HR-APP' },
                { title: 'Formal Warning / Show-Cause', desc: 'Disciplinary process documentation template', code: 'DOC-HR-WARN' },
                { title: 'Salary & Employment Certificate', desc: 'For banking & visa verification', code: 'DOC-HR-CERT' },
                { title: 'Experience & Relieving Letter', desc: 'Issued upon completed exit clearance', code: 'DOC-HR-EXP' },
                { title: 'Statutory Form 5A (EOBI)', desc: 'Registration of new insured workers', code: 'DOC-EOBI-5A' },
                { title: 'Monthly Wage Receipt Register', desc: 'Worker thumb impression / signature muster', code: 'DOC-WAGE-REG' },
              ].map((tpl, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                      {tpl.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{tpl.desc}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <code style={{ fontSize: '11px', color: '#94A3B8' }}>{tpl.code}</code>
                    <button
                      onClick={() => alert(`Generating ${tpl.title}...`)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#0F172A',
                      }}
                    >
                      Generate PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hr-ledgers':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
              Employee 360 Ledgers (Money, Attendance & Leave)
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Audit-compliant individual statement of account for each worker.
            </p>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Enter Worker Code (e.g. LF-104) or CNIC..."
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    width: '320px',
                  }}
                />
                <button
                  onClick={() => {}}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Load Statement
                </button>
              </div>
              <div style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                Select an employee from the directory or search above to view real-time money, attendance, and leave ledgers.
              </div>
            </div>
          </div>
        );

      case 'hr-recruitment':
      case 'hr-performance':
      case 'hr-exit':
      case 'hr-reports':
      case 'hr-settings':
      default:
        return (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '32px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  {hrNav.tabs.find((t) => t.id === activeTabId)?.label || 'HR Module Section'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Connected to Lahore Fashion Mill HR Ledger & Database
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px dashed #CBD5E1',
                padding: '36px 16px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '14px', color: '#475569', fontWeight: 500, margin: '0 0 8px 0' }}>
                No pending items in {hrNav.tabs.find((t) => t.id === activeTabId)?.label}.
              </p>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px 0' }}>
                All records are synchronized with central PostgreSQL HR database.
              </p>
              <button
                onClick={() => alert('New Entry Form')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Create Record
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <ModuleWorkspace
      moduleKey="hr"
      moduleTitle="HR"
      moduleSubtitle="People, Attendance & Payroll"
      moduleIconName="Users"
      tabs={hrNav.tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      activeSubPageId={activeSubPageId}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['HR OS', hrNav.tabs.find((t) => t.id === activeTabId)?.label || 'Overview']}
    >
      {renderTabContent()}
    </ModuleWorkspace>
  );
};
