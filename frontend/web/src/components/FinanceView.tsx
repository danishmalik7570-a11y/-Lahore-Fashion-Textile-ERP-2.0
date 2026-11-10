import React, { useState, useEffect } from 'react';
import { useMillData } from '../context/MillDataContext';
import { FinancialRevenueTrendChart } from './MillCharts';
import { 
  DollarSign, 
  Plus, 
  Search, 
  CheckCircle2, 
  X,
  Receipt,
  Printer,
  FileSpreadsheet,
  Building2,
  FileCheck2,
  Landmark,
  CreditCard,
  Users
} from 'lucide-react';
import { ClientsView } from './ClientsView';

export interface FinanceViewProps {
  initialTab?: 'receivables' | 'payables' | 'banking' | 'clients';
}

export const FinanceView: React.FC<FinanceViewProps> = ({ initialTab = 'receivables' }) => {
  const { invoices, addInvoice, markInvoicePaid, orders } = useMillData();
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables' | 'banking' | 'clients'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnnexModalOpen, setIsAnnexModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<any>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Supplier Payables (AP) State
  const [payables, setPayables] = useState([
    { id: 'ap-1', vendor: 'Al-Karam Yarn Mills Ltd', category: 'Raw Combed Cotton Yarn (30/1)', billNo: 'BILL-YRN-9021', amount: 4850000, dueDate: '2026-11-05', status: 'Approved for Payment', bank: 'Habib Bank Limited' },
    { id: 'ap-2', vendor: 'Archroma Chemicals Pakistan', category: 'Reactive Dyes & Pigments', billNo: 'BILL-CHM-4412', amount: 1620000, dueDate: '2026-11-12', status: 'Pending Verification', bank: 'Meezan Bank Ltd' },
    { id: 'ap-3', vendor: 'Clariant Masterbatches Ltd', category: 'Finishing Softeners & Enzymes', billNo: 'BILL-CLR-1108', amount: 980000, dueDate: '2026-11-18', status: 'Approved for Payment', bank: 'Standard Chartered' },
    { id: 'ap-4', vendor: 'Fauji Spares & Looms Engineering', category: 'Rapier Grippers & Needles', billNo: 'BILL-ENG-034', amount: 450000, dueDate: '2026-11-02', status: 'Paid', bank: 'Habib Bank Limited' },
    { id: 'ap-5', vendor: 'Packages Limited Lahore', category: 'Export Cartons & Polybags', billNo: 'BILL-PKG-8891', amount: 1240000, dueDate: '2026-11-15', status: 'Approved for Payment', bank: 'MCB Bank Limited' },
  ]);

  // Form State
  const [orderNumber, setOrderNumber] = useState(orders[0]?.orderNumber || 'PO-LF-2026-8841');
  const [clientName, setClientName] = useState(orders[0]?.clientName || 'Khaadi Apparel');
  const [subtotalPKR, setSubtotalPKR] = useState<number>(6840000);
  const [dueDate, setDueDate] = useState('2026-11-20');

  const salesTax = Math.round(subtotalPKR * 0.18);
  const wht = Math.round(subtotalPKR * 0.01);
  const totalNet = subtotalPKR + salesTax;

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBilling = invoices.reduce((sum, inv) => sum + inv.netPayablePKR, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.netPayablePKR, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.netPayablePKR, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !clientName || subtotalPKR <= 0) {
      alert('Please fill valid invoice amounts.');
      return;
    }

    addInvoice({
      orderNumber,
      clientName,
      subtotalPKR: Number(subtotalPKR),
      dueDate,
      status: 'Pending'
    });

    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <DollarSign size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Financial Ledgers & FBR Sales Tax Invoicing
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Standard 18% Sales Tax Invoices, Withholding Tax (WHT) deductors, bank remittance vouchers & aging
          </p>
        </div>

        {/* Industrial CFO Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Export Financial Ledger</span>
          </button>

          <button 
            onClick={() => setIsAnnexModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--blue-primary)' }}
          >
            <FileSpreadsheet size={15} />
            <span>FBR Annex-C Return</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Generate Sales Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INVOICED BILLING</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            PKR {(totalBilling / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● Includes 18% FBR Sales Tax
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>REALIZED / COLLECTED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            PKR {(totalPaid / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Cleared through State Bank RTGS
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECEIVABLES OUTSTANDING</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            PKR {(totalPending / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Under regular 30-day commercial terms
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FBR SALES TAX PAYABLE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            PKR {(invoices.reduce((sum, inv) => sum + inv.salesTaxPKR, 0) / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            E-filed Annexure C return ready
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('receivables')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'receivables' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'receivables' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Receipt size={16} />
          <span>Client Invoices & Receivables (AR)</span>
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'payables' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'payables' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Building2 size={16} />
          <span>Supplier Bills & Payables (AP)</span>
        </button>

        <button
          onClick={() => setActiveTab('banking')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'banking' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'banking' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Landmark size={16} />
          <span>Cash Flow & Commercial Banks</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'clients' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'clients' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} />
          <span>Client Ledgers & Accounts</span>
        </button>
      </div>

      {/* TAB 1: Receivables (AR) */}
      {activeTab === 'receivables' && (
        <>
          {/* Top Level Financial Graph */}
          <FinancialRevenueTrendChart />

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search invoices by invoice #, buyer, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>INVOICE NUMBER</th>
              <th style={{ padding: '12px 14px' }}>BUYER & ORDER</th>
              <th style={{ padding: '12px 14px' }}>SUBTOTAL (PKR)</th>
              <th style={{ padding: '12px 14px' }}>18% SALES TAX</th>
              <th style={{ padding: '12px 14px' }}>1% WHT</th>
              <th style={{ padding: '12px 14px' }}>NET PAYABLE (PKR)</th>
              <th style={{ padding: '12px 14px' }}>DUE DATE</th>
              <th style={{ padding: '12px 14px' }}>PAYMENT STATUS</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr 
                key={inv.id}
                style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                  {inv.invoiceNumber}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{inv.clientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.orderNumber}</div>
                </td>
                <td style={{ padding: '14px', fontWeight: 600 }}>
                  PKR {inv.subtotalPKR.toLocaleString()}
                </td>
                <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                  PKR {inv.salesTaxPKR.toLocaleString()}
                </td>
                <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                  PKR {inv.whtPKR.toLocaleString()}
                </td>
                <td style={{ padding: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  PKR {inv.netPayablePKR.toLocaleString()}
                </td>
                <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {inv.dueDate}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className={inv.status === 'Paid' ? 'badge badge-emerald' : 'badge badge-gold'}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedInvoiceForPrint(inv)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 9px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Print Official FBR Tax Invoice"
                    >
                      <Printer size={13} color="var(--blue-primary)" />
                      <span>Print Inv</span>
                    </button>
                    {inv.status !== 'Paid' ? (
                      <button
                        onClick={() => markInvoicePaid(inv.id)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={13} color="var(--emerald)" />
                        <span>Record Payment</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
                        ✓ Paid via Bank
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}

  {/* TAB 2: Supplier Payables (AP) */}
  {activeTab === 'payables' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
            Supplier Bills & Trade Payables (AP)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Three-way PO/GRN matching for yarn bobbins, chemical dyes, packaging, and machinery spares
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => alert('Generating AP Aging Summary Schedule for Executive Board...')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet size={15} color="var(--emerald)" />
            <span>Export AP Aging Schedule</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>SUPPLIER / VENDOR</th>
              <th style={{ padding: '12px 14px' }}>RAW MATERIAL / CATEGORY</th>
              <th style={{ padding: '12px 14px' }}>BILL / INVOICE #</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>OUTSTANDING (PKR)</th>
              <th style={{ padding: '12px 14px' }}>DUE DATE</th>
              <th style={{ padding: '12px 14px' }}>DISBURSAL BANK</th>
              <th style={{ padding: '12px 14px' }}>STATUS</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {payables.map((ap) => (
              <tr key={ap.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {ap.vendor}
                </td>
                <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {ap.category}
                </td>
                <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)', fontWeight: 600 }}>
                  {ap.billNo}
                </td>
                <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: 'var(--rose)' }}>
                  PKR {ap.amount.toLocaleString()}
                </td>
                <td style={{ padding: '14px', fontSize: '0.8rem' }}>{ap.dueDate}</td>
                <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ap.bank}</td>
                <td style={{ padding: '14px' }}>
                  <span className={ap.status === 'Paid' ? 'badge badge-emerald' : ap.status.includes('Approved') ? 'badge badge-blue' : 'badge badge-gold'} style={{ fontSize: '0.72rem' }}>
                    {ap.status}
                  </span>
                </td>
                <td style={{ padding: '14px', textAlign: 'center' }}>
                  {ap.status !== 'Paid' ? (
                    <button
                      onClick={() => {
                        setPayables((prev) => prev.map((p) => p.id === ap.id ? { ...p, status: 'Paid' } : p));
                        alert(`Payment voucher of PKR ${ap.amount.toLocaleString()} for ${ap.vendor} AUTHORIZED and queued to ${ap.bank}!`);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CreditCard size={13} />
                      <span>Authorize Voucher</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700 }}>
                      ✓ Disbursed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* TAB 3: Cash Flow & Commercial Banks */}
  {activeTab === 'banking' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {[
          { bank: 'Habib Bank Limited (HBL)', account: 'Corporate Export Collection #0042-9901-2', balance: 'PKR 84,200,000', facility: 'Current / Cash Management', cleared: '99.8%' },
          { bank: 'Meezan Bank Ltd', account: 'Islamic Commercial Working Cap #0201-1184-1', balance: 'PKR 52,400,000', facility: 'Murabaha Trade Finance', cleared: '100%' },
          { bank: 'Standard Chartered Bank', account: 'FCY Foreign Currency #8801-4412-0', balance: 'USD 142,000 (PKR 39.6M)', facility: 'Letter of Credit / Direct BL', cleared: '100%' },
          { bank: 'MCB Bank Limited', account: 'Local Mill Payroll Disbursal #1094-3321-9', balance: 'PKR 8,000,000', facility: 'Salary Corporate Sweep', cleared: '100%' },
        ].map((b, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={18} color="var(--blue-primary)" />
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{b.bank}</span>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Live API</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{b.account}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>{b.facility}</div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 600 }}>AVAILABLE LIQUIDITY</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--emerald)', marginTop: '2px' }}>
                {b.balance}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* TAB 4: Client Ledgers & Accounts */}
  {activeTab === 'clients' && (
    <ClientsView embedded />
  )}

      {/* Workable Modal: Generate Sales Tax Invoice */}
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
                  <Receipt size={20} color="var(--blue-primary)" />
                  <span>Generate Official Sales Tax Invoice</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Compliant with Federal Board of Revenue (FBR) Sales Tax Act 1990
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
                    const sel = orders.find(o => o.orderNumber === e.target.value);
                    if (sel) {
                      setClientName(sel.clientName);
                      setSubtotalPKR(sel.totalAmountPKR);
                    }
                  }}
                  required
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber}>{o.orderNumber} - {o.clientName} (PKR {o.totalAmountPKR.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Buyer Name</label>
                  <input type="text" className="input-field" value={clientName} readOnly />
                </div>

                <div>
                  <label className="label">Payment Due Date *</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Subtotal Invoiced (PKR) *</label>
                <input 
                  type="number" 
                  className="input-field" 
                  min="1000"
                  value={subtotalPKR}
                  onChange={(e) => setSubtotalPKR(Number(e.target.value))}
                  required
                />
              </div>

              {/* Computed Tax Summary Box */}
              <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <strong>PKR {subtotalPKR.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FBR Sales Tax (18%):</span>
                  <strong style={{ color: 'var(--blue-primary)' }}>+ PKR {salesTax.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Withholding Tax (1% WHT):</span>
                  <span style={{ color: 'var(--text-muted)' }}>PKR {wht.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                  <strong>Grand Total Net Payable:</strong>
                  <strong style={{ color: 'var(--emerald)' }}>PKR {totalNet.toLocaleString()}</strong>
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
                  <span>Issue & Transmit Tax Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Industrial Modal 1: FBR Annexure-C Monthly Return Statement */}
      {isAnnexModalOpen && (
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
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck2 size={22} color="var(--blue-primary)" />
                  <span>FBR IRIS Annexure-C (Domestic Sales Tax Return)</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Under Section 26 of Sales Tax Act 1990 — Mill Unit 2 Weaving & Finishing
                </p>
              </div>
              <button 
                onClick={() => setIsAnnexModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mill Tax Profile Banner */}
            <div style={{ background: 'var(--bg-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Registered Mill:</span>
                <strong style={{ color: 'var(--text-main)' }}>Lahore Fashion (Pvt) Ltd</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>STRN Registration:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>03-09-5200-112-99</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>National Tax # (NTN):</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>4182901-4</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Tax Return Period:</span>
                <strong style={{ color: 'var(--blue-primary)' }}>OCTOBER 2026</strong>
              </div>
            </div>

            {/* Summary KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL VALUE OF SUPPLIES (EXCL TAX)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>
                  PKR {invoices.reduce((s, i) => s + i.subtotalPKR, 0).toLocaleString()}
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OUTPUT TAX CHARGED (18% GST)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
                  PKR {invoices.reduce((s, i) => s + i.salesTaxPKR, 0).toLocaleString()}
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL NET REVENUE REALIZED</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '4px' }}>
                  PKR {invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.netPayablePKR, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 12px' }}>INV #</th>
                    <th style={{ padding: '8px 12px' }}>BUYER NAME</th>
                    <th style={{ padding: '8px 12px' }}>HS CODE</th>
                    <th style={{ padding: '8px 12px' }}>VALUE (PKR)</th>
                    <th style={{ padding: '8px 12px' }}>18% ST (PKR)</th>
                    <th style={{ padding: '8px 12px' }}>1% WHT</th>
                    <th style={{ padding: '8px 12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{inv.clientName}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>5208.1100</td>
                      <td style={{ padding: '8px 12px' }}>{inv.subtotalPKR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--blue-primary)', fontWeight: 600 }}>{inv.salesTaxPKR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{inv.whtPKR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className={inv.status === 'Paid' ? 'badge badge-emerald' : 'badge badge-gold'} style={{ fontSize: '0.7rem' }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Certified true schedule for FBR Iris E-Portal Integration
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                >
                  <Printer size={15} />
                  <span>Print Annex-C</span>
                </button>
                <button 
                  onClick={() => alert('FBR IRIS .csv schedule downloaded successfully.')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Export Iris CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Industrial Modal 2: Official Printable FBR 3-Copy Sales Tax Invoice */}
      {selectedInvoiceForPrint && (
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
            maxWidth: '750px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '32px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            {/* Top modal bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--blue-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>FBR SALES TAX INVOICE — OFFICIAL COMMERCIAL COPY</span>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForPrint(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Official Tax Invoice Sheet */}
            <div style={{ border: '2px solid #1e293b', padding: '24px', borderRadius: '4px', background: '#fff' }}>
              
              {/* Mill Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '14px', marginBottom: '16px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', margin: '0 0 4px 0' }}>
                  LAHORE FASHION TEXTILE MILLS (PVT) LTD
                </h1>
                <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                  Plot 42-B, Industrial Estate, Sheikhupura Road, Lahore, Pakistan | Tel: +92 42 35918800
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>
                  STRN: 03-09-5200-112-99 &nbsp;|&nbsp; NTN: 4182901-4 &nbsp;|&nbsp; PRA REG: 140822-1
                </div>
                <div style={{ display: 'inline-block', border: '1px solid #1e293b', padding: '2px 14px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 800, background: '#f8fafc' }}>
                  SALES TAX INVOICE (Rule 18, Sales Tax Rules 2006)
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '14px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>BUYER / RECIPIENT:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{selectedInvoiceForPrint.clientName}</div>
                  <div style={{ color: '#334155' }}>Buyer NTN: 2981045-8 &nbsp;|&nbsp; STRN: 04-07-5200-881-22</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Textile Garment Processing Unit, Kot Lakhpat, Lahore</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div><strong>Invoice #: </strong><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{selectedInvoiceForPrint.invoiceNumber}</span></div>
                  <div><strong>PO Ref: </strong><span style={{ fontFamily: 'var(--font-mono)' }}>{selectedInvoiceForPrint.orderNumber}</span></div>
                  <div><strong>Issue Date: </strong>{selectedInvoiceForPrint.dueDate}</div>
                  <div><strong>Payment Status: </strong><span style={{ color: selectedInvoiceForPrint.status === 'Paid' ? '#10b981' : '#b45309', fontWeight: 800 }}>{selectedInvoiceForPrint.status}</span></div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #94a3b8', color: '#0f172a' }}>
                    <th style={{ padding: '8px' }}>HS CODE</th>
                    <th style={{ padding: '8px' }}>GOODS DESCRIPTION</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>VALUE EXCL TAX</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>18% SALES TAX</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>TOTAL (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>5208.1100</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 700 }}>Finished Woven Fabrics (Roll Dispatch Lot)</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Order #{selectedInvoiceForPrint.orderNumber} — 100% Ring Spun Combed Weft</div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                      PKR {selectedInvoiceForPrint.subtotalPKR.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--blue-primary)' }}>
                      PKR {selectedInvoiceForPrint.salesTaxPKR.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800 }}>
                      PKR {(selectedInvoiceForPrint.subtotalPKR + selectedInvoiceForPrint.salesTaxPKR).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tax & Net Calculations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Bank Remittance Account:</div>
                  <div>Bank: <strong>Meezan Bank Ltd</strong> (Corporate Islamic Banking)</div>
                  <div>Account Title: <strong>Lahore Fashion Mills Ltd</strong></div>
                  <div>IBAN: <strong style={{ fontFamily: 'var(--font-mono)' }}>PK44MEZN000109200481001</strong></div>
                  <div style={{ marginTop: '6px', color: '#64748b' }}>* Payment within 30 days as per commercial contract.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Subtotal Value:</span>
                    <strong>PKR {selectedInvoiceForPrint.subtotalPKR.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Sales Tax (18%):</span>
                    <strong style={{ color: 'var(--blue-primary)' }}>+ PKR {selectedInvoiceForPrint.salesTaxPKR.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>1% WHT Sec 153:</span>
                    <span>- PKR {selectedInvoiceForPrint.whtPKR.toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <strong>NET PAYABLE:</strong>
                    <strong style={{ color: '#0f172a' }}>PKR {selectedInvoiceForPrint.netPayablePKR.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ borderBottom: '1px solid #334155', height: '35px' }}></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Prepared By (Accounts)</div>
                </div>
                <div style={{ border: '2px dashed #94a3b8', padding: '6px 14px', borderRadius: '4px', textAlign: 'center', fontSize: '0.72rem', color: '#475569' }}>
                  ★ OFFICIAL MILL SEAL ★<br />Lahore Fashion Mills
                </div>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ borderBottom: '1px solid #334155', height: '35px' }}></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Authorized Signatory / CFO</div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedInvoiceForPrint(null)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>Print Official 3-Copy Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
