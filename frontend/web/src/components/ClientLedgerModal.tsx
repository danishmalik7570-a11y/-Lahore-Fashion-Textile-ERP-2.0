import React, { useState } from 'react';
import type { ClientItem } from '../context/MillDataContext';
import { 
  X, 
  Download, 
  Printer, 
  Plus, 
  Building2
} from 'lucide-react';

interface ClientLedgerModalProps {
  client: ClientItem | null;
  isOpen: boolean;
  onClose: () => void;
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

export const ClientLedgerModal: React.FC<ClientLedgerModalProps> = ({ client, isOpen, onClose }) => {
  if (!isOpen || !client) return null;

  // Initial Mock Ledger for the client
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    {
      id: 'LED-001',
      date: '2026-09-01',
      refNo: 'BAL-B/F',
      type: 'Invoice',
      description: 'Opening Balance Carried Forward',
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
      description: 'Tax Invoice: 18,000m Lawn Printed Kurti 80/80 (PO-2026-881)',
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
      description: 'IBFT Settlement via HBL Corporate Account #009281',
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
      description: 'Section 153 WHT 4% Withheld by Buyer under FBR NTN',
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
      description: 'Tax Invoice: 12,000m Sapphire Stretch Denim Twill 11.5oz',
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
      description: 'Dispatched 5,000m Export Twill to Karachi Port Godown',
      debitPKR: 4350000,
      creditPKR: 0,
      balancePKR: 21050000,
      status: 'Pending',
    },
  ]);

  const [filterType, setFilterType] = useState<string>('all');
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
  const filteredEntries = filterType === 'all' 
    ? ledgerEntries 
    : filterType === 'invoices' 
      ? ledgerEntries.filter(e => e.type === 'Invoice') 
      : filterType === 'payments' 
        ? ledgerEntries.filter(e => e.type === 'Payment' || e.type === 'Tax Withheld')
        : ledgerEntries.filter(e => e.type === 'Challan');

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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        style={{ maxWidth: '1050px', padding: '0', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f274a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Building2 size={24} color="#93c5fd" />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
                {client.name}
              </h2>
              <span className="badge badge-blue" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }}>
                {client.brandType}
              </span>
            </div>
            <p style={{ color: '#bfdbfe', fontSize: '0.85rem', margin: 0 }}>
              Commercial Statement of Account & Live Financial Ledger • {client.city}, Pakistan
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={exportCSV}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Financial KPI Dashboard Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '20px 28px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT OUTSTANDING</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '2px' }}>
              PKR {(currentRunningBalance / 1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Net balance due to mill
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPROVED CREDIT LIMIT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              PKR {(creditLimit / 1000000).toFixed(1)}M
            </div>
            <div style={{ fontSize: '0.72rem', color: utilPercent > 80 ? 'var(--rose)' : 'var(--emerald)', marginTop: '4px', fontWeight: 600 }}>
              {utilPercent}% limit utilized
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE HEADROOM</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: headroomPKR > 0 ? 'var(--emerald)' : 'var(--rose)', marginTop: '2px' }}>
              PKR {(headroomPKR / 1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Safe for new PO issuance
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FBR TAX IDENTIFIERS</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              NTN: {client.ntn}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              STRN: {client.strn}
            </div>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              Commercial Risk Meter: {utilPercent}% Limit Consumed
            </span>
            <span style={{ fontWeight: 700, color: utilPercent > 80 ? 'var(--rose)' : 'var(--blue-primary)' }}>
              {utilPercent > 80 ? '⚠️ High Utilization — Payment Due' : '● Good Standing'}
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{
              width: `${utilPercent}%`,
              height: '100%',
              background: utilPercent > 80 ? 'var(--rose)' : utilPercent > 50 ? 'var(--gold)' : 'var(--blue-primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Filter Bar & Action Button */}
        <div style={{
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: `All (${ledgerEntries.length})` },
              { id: 'invoices', label: 'Invoices' },
              { id: 'payments', label: 'Payments & Tax' },
              { id: 'challans', label: 'Delivery Challans' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className="btn btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  background: filterType === tab.id ? 'var(--blue-primary)' : '#ffffff',
                  color: filterType === tab.id ? '#ffffff' : 'var(--text-dim)',
                  borderColor: filterType === tab.id ? 'var(--blue-primary)' : 'var(--border-medium)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem', padding: '8px 14px' }}
          >
            <Plus size={16} />
            <span>Record Buyer Payment Voucher</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div style={{ padding: '0 28px 28px 28px', overflowX: 'auto', maxHeight: '420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
              <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                <th style={{ padding: '10px 12px' }}>DATE</th>
                <th style={{ padding: '10px 12px' }}>REF / DOC #</th>
                <th style={{ padding: '10px 12px' }}>TYPE</th>
                <th style={{ padding: '10px 12px' }}>DESCRIPTION</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>DEBIT (PKR)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>CREDIT (PKR)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>RUNNING BAL (PKR)</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((row) => (
                <tr 
                  key={row.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {row.date}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)', whiteSpace: 'nowrap' }}>
                    {row.refNo}
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <span className={
                      row.type === 'Invoice' ? 'badge badge-blue' :
                      row.type === 'Payment' ? 'badge badge-emerald' :
                      row.type === 'Tax Withheld' ? 'badge badge-purple' : 'badge badge-gold'
                    } style={{ fontSize: '0.7rem' }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-main)', maxWidth: '300px' }}>
                    {row.description}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: row.debitPKR > 0 ? 'var(--text-main)' : 'var(--text-sub)' }}>
                    {row.debitPKR > 0 ? row.debitPKR.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: row.creditPKR > 0 ? 'var(--emerald)' : 'var(--text-sub)' }}>
                    {row.creditPKR > 0 ? row.creditPKR.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
                    PKR {row.balancePKR.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span className={
                      row.status === 'Cleared' || row.status === 'Settled' ? 'badge badge-emerald' :
                      row.status === 'Pending' ? 'badge badge-gold' : 'badge badge-rose'
                    } style={{ fontSize: '0.7rem' }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nested Payment Modal */}
        {isPaymentModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsPaymentModalOpen(false)}>
            <div 
              className="modal-content animate-fade-in" 
              style={{ maxWidth: '520px', padding: '24px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                  Record Payment Voucher
                </h3>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                      <option value="Bank Cheque">Crossed Bank Cheque</option>
                      <option value="Letter of Credit LC">Letter of Credit (LC)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Banking Reference / Cheque # *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. IBFT-HBL-992384 or CHQ-09923"
                    required
                  />
                </div>

                <div>
                  <label className="label">Narration / PO Notes</label>
                  <input
                    type="text"
                    className="input-field"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Payment remarks"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setIsPaymentModalOpen(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Confirm & Post to Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
