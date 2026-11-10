import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { useMillData } from '../../context/MillDataContext';
import { FinanceView } from '../../components/FinanceView';
import { ClientsView } from '../../components/ClientsView';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  AlertCircle,
  Building2,
  Printer,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Scale
} from 'lucide-react';

interface FinanceWorkspaceViewProps {
  initialTab?: string;
}

export const FinanceWorkspaceView: React.FC<FinanceWorkspaceViewProps> = ({
  initialTab = 'fin-overview'
}) => {
  const { invoices } = useMillData();
  const { user } = useAuth();
  const finNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'finance')!;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubPage, setActiveSubPage] = useState<string | undefined>();

  // Calculations
  const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.status !== 'Paid' ? inv.netPayablePKR : 0), 0) || 18450000;
  const overdueReceivables = Math.round(totalReceivables * 0.28);
  const totalPayables = 9140000;
  const bankBalance = 34250000;
  const avgCostPerMeter = 168.5; // PKR

  const quickActions: QuickActionItem[] = [
    {
      id: 'new-invoice',
      label: '+ Create Tax Invoice',
      primary: true,
      onClick: () => setActiveTab('fin-invoices')
    },
    {
      id: 'view-ledgers',
      label: 'Client Ledgers',
      onClick: () => setActiveTab('fin-client-ledgers')
    }
  ];

  return (
    <ModuleWorkspace
      moduleKey="finance"
      moduleTitle="Finance"
      moduleSubtitle="Accounts, General Ledgers & Cost Profitability"
      moduleIconName="DollarSign"
      tabs={finNav.tabs}
      activeTabId={activeTab}
      onTabChange={(tabId, subId) => {
        setActiveTab(tabId);
        setActiveSubPage(subId);
      }}
      activeSubPageId={activeSubPage}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Finance OS', finNav.tabs.find((t) => t.id === activeTab)?.label || 'Overview']}
    >
      {/* 1. OVERVIEW */}
      {activeTab === 'fin-overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 5 KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Total Receivables (AR)</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={18} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>PKR {(totalReceivables / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Across active buyer accounts
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Overdue AR (&gt;30d)</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={18} color="#dc2626" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>PKR {(overdueReceivables / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                Requires prompt recovery follow-up
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Total Payables (AP)</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownLeft size={18} color="#ea580c" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>PKR {(totalPayables / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Yarn, chemical & packaging bills
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Bank & Cash Balance</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#16a34a" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>PKR {(bankBalance / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                HBL, Meezan & Petty Cash
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Avg Cost / Metre</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale size={18} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>PKR {avgCostPerMeter}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Yarn + Dyes + Power + Labour
              </div>
            </div>
          </div>

          {/* AR AGING HORIZONTAL STRIP */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Receivables (AR) Aging Summary — Lahore Fashion Mill</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current (Not Due)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 10.4M</div>
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>56% of total</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>1 – 30 Days Overdue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 4.2M</div>
                <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>23% of total</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>31 – 60 Days Overdue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 2.1M</div>
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>11% of total</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: '4px solid #ea580c' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>61 – 90 Days Overdue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 1.2M</div>
                <div style={{ fontSize: 11, color: '#ea580c', marginTop: 2 }}>7% of total</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>&gt; 90 Days (Critical)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginTop: 4 }}>PKR 0.55M</div>
                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>3% of total</div>
              </div>
            </div>
          </div>

          {/* QUICK INVOICE ACCESS & ACTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Sales Tax Invoices & Billing Operations</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>FBR Annex-C compliant textile sales tax invoices and recovery tracking</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setActiveTab('fin-client-ledgers')}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                View Client Ledgers
              </button>
              <button
                onClick={() => setActiveTab('fin-invoices')}
                style={{ padding: '7px 14px', borderRadius: 6, background: '#2563eb', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Create Tax Invoice
              </button>
            </div>
          </div>

          {/* INVOICES TABLE */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Invoice #</th>
                  <th style={{ padding: '12px 16px' }}>Client Name</th>
                  <th style={{ padding: '12px 16px' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px' }}>Due Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total (PKR)</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Print / Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <DollarSign size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 8).map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{inv.clientName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{inv.orderNumber}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{inv.dueDate}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        PKR {inv.netPayablePKR.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                            color: inv.status === 'Paid' ? '#166534' : '#991b1b'
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => window.print()}
                          title="Print Sales Tax Invoice"
                          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', color: '#475569' }}
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CLIENT LEDGERS */}
      {activeTab === 'fin-client-ledgers' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <ClientsView />
        </div>
      )}

      {/* 3. INVOICES */}
      {activeTab === 'fin-invoices' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <FinanceView initialTab="receivables" />
        </div>
      )}

      {/* 4. RECEIPTS & PAYMENTS */}
      {activeTab === 'fin-receipts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recovery & Payment Entries</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Post receipts from buyers and track official withholding tax deductions</p>
            </div>
            <button
              onClick={() => alert('Record Receipt Voucher modal')}
              style={{ padding: '7px 14px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              + Record Recovery Receipt
            </button>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>All received payments are automatically mapped to buyer ledgers and bank accounts.</p>
          </div>
        </div>
      )}

      {/* 5. CHEQUES */}
      {activeTab === 'fin-cheques' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Post-Dated Cheques (PDC) Register</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Cheques in hand, deposited in clearing, and supplier outgoing cheques</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Cheques in Hand</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 6,400,000</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>5 Buyer Cheques</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>In Clearing Today</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>PKR 2,800,000</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Meezan Bank Clearing</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Supplier Cheques Issued</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706', marginTop: 4 }}>PKR 4,150,000</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Due within 10 days</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Dishonored / Bounced</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>0</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Clean clearing record</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PAYABLES */}
      {activeTab === 'fin-payables' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <FinanceView initialTab="payables" />
        </div>
      )}

      {/* 7. EMPLOYEE LEDGERS */}
      {activeTab === 'fin-employee-ledgers' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Employee Wage & Advance Ledgers</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Synchronized with Lahore Fashion Mill HR OS for wage disbursement and loan repayments</p>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Current Month Wage Provision: PKR 4,450,000</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Active Advance Balances to Recover: PKR 385,000</div>
          </div>
        </div>
      )}

      {/* 8. CASH & BANK BOOK */}
      {activeTab === 'fin-cashbook' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <FinanceView initialTab="banking" />
        </div>
      )}

      {/* 9. JOURNAL */}
      {activeTab === 'fin-journal' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>General Journal & Adjustment Vouchers (JV)</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Double-entry debits and credits with audit approval trail</p>
          <div style={{ padding: 20, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 6 }}>
            All journal vouchers for the period are balanced. Net variance: PKR 0.00
          </div>
        </div>
      )}

      {/* 10. COSTING & PROFIT */}
      {activeTab === 'fin-costing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Fabric Lot Costing & Profit Margins</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Real-time cost build-up: Yarn + Sizing + Weaving + Dyeing + Finishing + Power + Overhead</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 14px' }}>Fabric Quality</th>
                  <th style={{ padding: '10px 14px' }}>Yarn Cost / m</th>
                  <th style={{ padding: '10px 14px' }}>Weaving / m</th>
                  <th style={{ padding: '10px 14px' }}>Dyeing & Fin / m</th>
                  <th style={{ padding: '10px 14px' }}>Total Cost / m</th>
                  <th style={{ padding: '10px 14px' }}>Sale Price / m</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { quality: '100% Cotton Twill 16x12', yarn: 94, weave: 28, dye: 36, total: 158, sale: 195, margin: '19.0%' },
                  { quality: 'Cotton Satin 40x40', yarn: 118, weave: 32, dye: 42, total: 192, sale: 240, margin: '20.0%' },
                  { quality: 'Polyester Cotton Oxford 20x16', yarn: 82, weave: 24, dye: 30, total: 136, sale: 165, margin: '17.6%' },
                ].map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{c.quality}</td>
                    <td style={{ padding: '10px 14px' }}>PKR {c.yarn}</td>
                    <td style={{ padding: '10px 14px' }}>PKR {c.weave}</td>
                    <td style={{ padding: '10px 14px' }}>PKR {c.dye}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>PKR {c.total}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>PKR {c.sale}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{c.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. TRIAL BALANCE & CLOSE */}
      {activeTab === 'fin-trial-balance' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Trial Balance & Period Closing</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Monthly accounts closure checklist and verified debit/credit totals</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Debits</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 142,500,000</div>
            </div>
            <div style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Credits</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 142,500,000</div>
            </div>
            <div style={{ flex: 1, padding: 16, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, color: '#166534' }}>Variance</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>0.00 (Balanced)</div>
            </div>
          </div>
        </div>
      )}

      {/* 12. TAX */}
      {activeTab === 'fin-tax' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>FBR & PRA Tax Compliance</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Sales tax return Annex-C filing data and Section 153 Withholding Tax slips</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => alert('Exporting FBR Annex-C CSV')}
              style={{ padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              Export FBR Annex-C
            </button>
            <button
              onClick={() => alert('Exporting PRA Withholding Returns')}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              Export PRA Returns
            </button>
          </div>
        </div>
      )}

      {/* 13. REPORTS */}
      {activeTab === 'fin-reports' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Financial Statements & Telemetry</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>P&L summary, monthly cash flow, and AR/AP aging exports</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.print()}
              style={{ padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={16} /> Print P&L Statement
            </button>
          </div>
        </div>
      )}
    </ModuleWorkspace>
  );
};
