import React, { useState } from 'react';
import { usePortal } from '../PortalContext';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Landmark,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const FinanceDashboardView: React.FC = () => {
  const { requestStepUpAuth } = usePortal();

  const [bankBalance] = useState('PKR 142.8M');
  const [pendingDisbursements, setPendingDisbursements] = useState([
    { id: 'db-1', party: 'Al-Karam Yarn Mills Ltd', amount: 'PKR 4,850,000', invoice: 'INV-YRN-9021', status: 'PENDING' },
    { id: 'db-2', party: 'Archroma Chemicals Pakistan', amount: 'PKR 1,620,000', invoice: 'INV-CHM-4412', status: 'PENDING' },
  ]);

  const handleAuthorizePayment = (id: string, amount: string) => {
    requestStepUpAuth(`authorize_payment_${amount}`, () => {
      setPendingDisbursements((prev) => prev.filter((p) => p.id !== id));
      alert(`Bank payment voucher for ${amount} AUTHORIZED & queued to HBL Corporate Net-Banking.`);
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
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Finance OS
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Audit-Locked Ledgers
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Financial Governance & Ledgers
          </h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => alert('New Payment Voucher Modal')}
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
            <Plus size={16} /> New Payment Voucher
          </button>

          <button
            onClick={() => alert('Reconciling HBL Bank Feed...')}
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
            <RefreshCw size={16} /> Bank Reconciliation
          </button>
        </div>
      </div>

      {/* ── KPI Strip (Financial Headline Metrics) ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '14px',
        }}
      >
        {[
          { label: 'Bank Liquidity', value: bankBalance, sub: 'Across 4 HBL/MCB accounts', icon: Landmark, color: '#10B981' },
          { label: 'Client Receivables (AR)', value: 'PKR 86.4M', sub: 'PKR 14.2M overdue', icon: Receipt, color: '#3B82F6' },
          { label: 'Supplier Payables (AP)', value: 'PKR 42.1M', sub: 'Yarn & dye payables', icon: Building2, color: '#F59E0B' },
          { label: 'October Gross Margin', value: '28.4%', sub: 'Target 26.5%', icon: TrendingUp, color: '#10B981' },
          { label: 'Unreconciled Items', value: '3', sub: 'Cheques in clearing', icon: AlertCircle, color: '#EF4444' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
            <div style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── AR Aging & High-Value Payables ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* AR Aging Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 14px 0' }}>
            Accounts Receivable (AR) Aging Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { bucket: 'Current (0-30d)', amount: 'PKR 54.2M', pct: '63%', color: '#10B981' },
              { bucket: '31-60 Days', amount: 'PKR 18.0M', pct: '21%', color: '#3B82F6' },
              { bucket: '61-90 Days', amount: 'PKR 9.8M', pct: '11%', color: '#F59E0B' },
              { bucket: '90+ Days Overdue', amount: 'PKR 4.4M', pct: '5%', color: '#EF4444' },
            ].map((b, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{b.bucket}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: b.color, marginTop: '4px' }}>{b.amount}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{b.pct} of total</div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Value Supplier Disbursements (Step-Up Action) */}
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
              Disbursements Awaiting Release
            </h3>
            <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>Step-Up 2FA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingDisbursements.map((d) => (
              <div
                key={d.id}
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
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{d.party}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {d.invoice} • <strong style={{ color: '#047857' }}>{d.amount}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleAuthorizePayment(d.id, d.amount)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#047857',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CreditCard size={14} /> Authorize
                </button>
              </div>
            ))}

            {pendingDisbursements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                ✓ All pending payment disbursements released!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
