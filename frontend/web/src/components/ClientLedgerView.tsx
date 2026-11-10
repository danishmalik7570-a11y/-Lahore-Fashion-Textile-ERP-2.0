import React, { useState } from 'react';
import type { ClientItem } from '../context/MillDataContext';
import { 
  ArrowLeft,
  Building2, 
  Download, 
  Printer, 
  Plus, 
  Receipt, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';

export interface ClientLedgerViewProps {
  client: ClientItem;
  onBack: () => void;
}

export interface LedgerEntry {
  id: string;
  date: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Challan' | 'Tax Withheld' | 'Credit Note';
  description: string;
  debitPKR: number; // Amount billed to client
  creditPKR: number; // Amount paid by client
  balancePKR: number; // Running balance
  status: 'Settled' | 'Cleared' | 'Pending' | 'Overdue';
}

export const ClientLedgerView: React.FC<ClientLedgerViewProps> = ({ client, onBack }) => {
  // Initial Mock Ledger for the client
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    {
      id: 'LED-001',
      date: '2026-09-01',
      refNo: 'BAL-B/F',
      type: 'Invoice',
      description: 'Opening Balance Carried Forward (FY 2026-27)',
      debitPKR: 12500000,
      creditPKR: 0,
      balancePKR: 12500000,
      status: 'Settled',
    },
    {
      id: 'LED-002',
      date: '2026-09-12',
      refNo: 'INV-2026-881',
      type: 'Invoice',
      description: 'Sales Tax Invoice: 18,000m Lawn Printed Kurti 80/80 Fabric (Sales Order #PO-881)',
      debitPKR: 9360000,
      creditPKR: 0,
      balancePKR: 21860000,
      status: 'Settled',
    },
    {
      id: 'LED-003',
      date: '2026-09-24',
      refNo: 'PAY-HBL-9041',
      type: 'Payment',
      description: 'Corporate IBFT Real-Time Settlement via HBL Account #009281',
      debitPKR: 0,
      creditPKR: 15000000,
      balancePKR: 6860000,
      status: 'Cleared',
    },
    {
      id: 'LED-004',
      date: '2026-09-24',
      refNo: 'WHT-FBR-09',
      type: 'Tax Withheld',
      description: 'FBR Income Tax Section 153 (4% Withheld by Buyer under Active Taxpayer ATL)',
      debitPKR: 0,
      creditPKR: 600000,
      balancePKR: 6260000,
      status: 'Cleared',
    },
    {
      id: 'LED-005',
      date: '2026-10-04',
      refNo: 'INV-2026-904',
      type: 'Invoice',
      description: 'Sales Tax Invoice: 12,000m Sapphire Stretch Denim Twill 11.5oz (Sales Order #PO-904)',
      debitPKR: 10440000,
      creditPKR: 0,
      balancePKR: 16700000,
      status: 'Pending',
    },
    {
      id: 'LED-006',
      date: '2026-10-18',
      refNo: 'CHL-KHI-401',
      type: 'Challan',
      description: 'Goods Delivery Challan: Dispatched 5,000m Export Twill to Karachi Port Godown',
      debitPKR: 4350000,
      creditPKR: 0,
      balancePKR: 21050000,
      status: 'Pending',
    },
    {
      id: 'LED-007',
      date: '2026-10-22',
      refNo: 'PAY-MCB-3310',
      type: 'Payment',
      description: 'Bank Payment Advice: Partial Settlement against September Invoices',
      debitPKR: 0,
      creditPKR: 4000000,
      balancePKR: 17050000,
      status: 'Cleared',
    },
  ]);

  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New Payment Form State
  const [payAmount, setPayAmount] = useState<number>(3500000);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'Online IBFT' | 'Bank Cheque' | 'Letter of Credit LC'>('Online IBFT');
  const [payRef, setPayRef] = useState<string>('IBFT-MCB-99124');
  const [payNotes, setPayNotes] = useState<string>('Advance payment against PO delivery');

  // Summary Metrics
  const totalBilled = ledgerEntries.reduce((sum, item) => sum + item.debitPKR, 0);
  const totalReceived = ledgerEntries.reduce((sum, item) => sum + item.creditPKR, 0);
  const currentRunningBalance = totalBilled - totalReceived;
  const creditLimit = client.creditLimitPKR;
  const utilPercent = Math.min(Math.round((currentRunningBalance / creditLimit) * 100), 100);
  const headroomPKR = Math.max(0, creditLimit - currentRunningBalance);

  // Filtered Entries
  const filteredEntries = ledgerEntries.filter(e => {
    const matchesFilter = filterType === 'all' 
      ? true 
      : filterType === 'invoices' 
        ? e.type === 'Invoice' 
        : filterType === 'payments' 
          ? (e.type === 'Payment' || e.type === 'Tax Withheld')
          : e.type === 'Challan';
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.refNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const newBalance = currentRunningBalance - payAmount;
    const newEntry: LedgerEntry = {
      id: `LED-${Date.now().toString().slice(-4)}`,
      date: payDate,
      refNo: payRef,
      type: 'Payment',
      description: `${payMethod} Payment: ${payNotes}`,
      debitPKR: 0,
      creditPKR: payAmount,
      balancePKR: newBalance,
      status: 'Cleared',
    };

    setLedgerEntries(prev => [...prev, newEntry]);
    setIsPaymentModalOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Reference', 'Type', 'Description', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)', 'Status'];
    const rows = ledgerEntries.map(e => [
      e.date,
      e.refNo,
      e.type,
      `"${e.description.replace(/"/g, '""')}"`,
      e.debitPKR,
      e.creditPKR,
      e.balancePKR,
      e.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statement_of_Account_${client.name.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <ArrowLeft size={16} color="var(--blue-primary)" />
            <span>Back to Clients & Accounts</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>/</span>
            <span>Commercial Accounts</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {client.name} (Financial Statement)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--emerald-light)',
            color: 'var(--emerald)',
            border: '1px solid var(--emerald-border)',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
          }}>
            <CheckCircle2 size={13} />
            FBR Active Taxpayer (ATL) Verified
          </span>

          <button 
            onClick={exportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <Printer size={15} />
            <span>Print Ledger</span>
          </button>

          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px', fontWeight: 700 }}
          >
            <Plus size={15} />
            <span>Record Payment Voucher</span>
          </button>
        </div>
      </div>

      {/* Hero Executive Commercial Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 60%, #172554 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 30px rgba(29, 78, 216, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ffffff',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
          }}>
            <Building2 size={32} color="#1d4ed8" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {client.name}
              </h1>
              <span style={{
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                {client.brandType}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                ACTIVE ACCOUNT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', color: '#bfdbfe', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span>{client.city}, Pakistan</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>FBR NTN: {client.ntn}</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>STRN: {client.strn}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#93c5fd" /> {client.contactPerson}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} color="#93c5fd" /> {client.phone}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} color="#93c5fd" /> {client.email}
              </span>
            </div>
          </div>
        </div>

        {/* Credit Exposure Meter */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '280px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#bfdbfe', marginBottom: '6px' }}>
            <span>CREDIT UTILIZATION</span>
            <strong style={{ color: '#ffffff' }}>{utilPercent}%</strong>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{
              width: `${utilPercent}%`,
              height: '100%',
              background: utilPercent > 80 ? '#f87171' : utilPercent > 50 ? '#fbbf24' : '#34d399',
              borderRadius: 'var(--radius-full)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#93c5fd', marginTop: '6px' }}>
            <span>Used: PKR {(currentRunningBalance / 1000000).toFixed(2)}M</span>
            <span>Limit: PKR {(creditLimit / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      {/* Financial Exposure KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT OUTSTANDING BALANCE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            PKR {currentRunningBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={13} /> Active Net Receivable
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPROVED CREDIT LIMIT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            PKR {creditLimit.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Underwritten by Finance Committee
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE CREDIT HEADROOM</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: headroomPKR > 0 ? 'var(--emerald)' : 'var(--rose)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            PKR {headroomPKR.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '6px' }}>
            Available for new fabric dispatch orders
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INVOICED (DEBITS)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            PKR {totalBilled.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Cumulative goods dispatched & billed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL RECEIVED (CREDITS)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--emerald)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            PKR {totalReceived.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '6px' }}>
            Bank settlements & WHT tax credits
          </div>
        </div>
      </div>

      {/* Main Ledger Table Panel */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Controls, Filters & Search */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'invoices', label: 'Invoices Only' },
              { id: 'payments', label: 'Payments & WHT' },
              { id: 'challans', label: 'Dispatch Challans' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: filterType === f.id ? 700 : 500,
                  border: filterType === f.id ? '1px solid var(--blue-primary)' : '1px solid var(--border-light)',
                  background: filterType === f.id ? 'var(--blue-primary)' : '#ffffff',
                  color: filterType === f.id ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search reference, invoice #, bank notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '280px', padding: '7px 12px', fontSize: '0.82rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredEntries.length} records
            </span>
          </div>
        </div>

        {/* Double-Entry Financial Ledger Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-medium)', background: '#ffffff', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
                <th style={{ padding: '14px 18px' }}>DATE</th>
                <th style={{ padding: '14px 18px' }}>REF / VOUCHER</th>
                <th style={{ padding: '14px 18px' }}>TRANSACTION TYPE</th>
                <th style={{ padding: '14px 18px' }}>PARTICULARS & DESCRIPTION</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>DEBIT (PKR)</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>CREDIT (PKR)</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>RUNNING BALANCE (PKR)</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>CLEARANCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr 
                  key={entry.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: 600 }}>
                    {entry.date}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                    {entry.refNo}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={
                      entry.type === 'Invoice' ? 'badge badge-blue' :
                      entry.type === 'Payment' ? 'badge badge-emerald' :
                      entry.type === 'Tax Withheld' ? 'badge badge-gold' : 'badge badge-subtle'
                    } style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      {entry.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', maxWidth: '360px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    {entry.description}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: entry.debitPKR > 0 ? 800 : 400, color: entry.debitPKR > 0 ? 'var(--text-main)' : 'var(--text-sub)' }}>
                    {entry.debitPKR > 0 ? entry.debitPKR.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: entry.creditPKR > 0 ? 800 : 400, color: entry.creditPKR > 0 ? 'var(--emerald)' : 'var(--text-sub)' }}>
                    {entry.creditPKR > 0 ? entry.creditPKR.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--blue-primary)', fontSize: '0.95rem' }}>
                    PKR {entry.balancePKR.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                    <span className={
                      entry.status === 'Cleared' || entry.status === 'Settled' ? 'badge badge-emerald' : 'badge badge-gold'
                    } style={{ fontSize: '0.72rem' }}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ledger Aging & Reconciliation Summary Footer */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-subtle)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>AGING ANALYSIS BREAKDOWN</span>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-sub)' }}>0-30 Days:</span> <strong>PKR 14.8M</strong></div>
              <div><span style={{ color: 'var(--text-sub)' }}>31-60 Days:</span> <strong>PKR 2.2M</strong></div>
              <div><span style={{ color: 'var(--text-sub)' }}>61-90 Days:</span> <strong style={{ color: 'var(--gold)' }}>PKR 0.0M</strong></div>
              <div><span style={{ color: 'var(--text-sub)' }}>&gt;90 Days:</span> <strong style={{ color: 'var(--rose)' }}>PKR 0.0M</strong></div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NET COMMERCIAL POSITION</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
              PKR {currentRunningBalance.toLocaleString()} DR
            </div>
          </div>
        </div>

      </div>

      {/* Record Payment Voucher Modal Dialog */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsPaymentModalOpen(false)}>
          <div 
            className="modal-content animate-fade-in" 
            style={{ maxWidth: '580px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={20} color="var(--blue-primary)" />
                  <span>Record Payment Voucher</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Credit client account against outstanding invoices via bank transfer or cheque
                </p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Settlement Amount (PKR) *</label>
                <input 
                  type="number"
                  className="input-field"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  min="1000"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="label">Payment Date *</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Payment Instrument *</label>
                  <select 
                    className="input-field"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                  >
                    <option value="Online IBFT">Online IBFT (Bank Transfer)</option>
                    <option value="Bank Cheque">Bank Cheque / Pay Order</option>
                    <option value="Letter of Credit LC">Letter of Credit (LC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Bank Reference / Cheque No *</label>
                <input 
                  type="text"
                  className="input-field"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. IBFT-HBL-992144 or CHQ #771249"
                  required
                />
              </div>

              <div>
                <label className="label">Particulars & Reconciliation Notes</label>
                <input 
                  type="text"
                  className="input-field"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Full settlement against Invoice #INV-2026-904"
                />
              </div>

              <div className="form-actions" style={{ marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Post Payment to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
