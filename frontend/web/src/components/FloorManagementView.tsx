import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Tablet,
  ShieldAlert,
  History,
  MessageSquare,
  Maximize2,
  CheckCircle2,
  Filter,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  AlertOctagon
} from 'lucide-react';
import type { FloorOutputItem, FloorAnomalyItem, KioskDeviceItem } from '../types';

interface FloorManagementViewProps {
  onLaunchKiosk: () => void;
}

export const FloorManagementView: React.FC<FloorManagementViewProps> = ({ onLaunchKiosk }) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'late_entry' | 'kiosks' | 'anomalies' | 'audit' | 'whatsapp'>('approvals');

  // Approvals State
  const [entries, setEntries] = useState<FloorOutputItem[]>([
    {
      id: 'ent-101',
      clientUuid: 'c-uuid-001',
      bundleId: 'BND-2026-8841-10',
      lotNumber: 'LF-2026-8841',
      operationId: 'OP-COLLAR-01',
      operationName: 'Collar Attachment & Stitching',
      workerId: 'w-1042',
      workerName: 'Muhammad Aslam',
      workerCode: 'WF-1042',
      kioskCode: 'KSK-STITCH-04',
      channel: 'KIOSK',
      qtyGood: 20,
      qtyReject: 0,
      unitRatePKR: 22.5,
      earningsPreviewPKR: 450,
      occurredAt: '2026-10-27 10:45 AM',
      isLateEntry: false,
      status: 'PENDING'
    },
    {
      id: 'ent-102',
      clientUuid: 'c-uuid-002',
      bundleId: 'BND-2026-8841-11',
      lotNumber: 'LF-2026-8841',
      operationId: 'OP-COLLAR-01',
      operationName: 'Collar Attachment & Stitching',
      workerId: 'w-1088',
      workerName: 'Tariq Mehmood',
      workerCode: 'WF-1088',
      kioskCode: 'KSK-STITCH-02',
      channel: 'KIOSK',
      qtyGood: 48,
      qtyReject: 0,
      unitRatePKR: 22.5,
      earningsPreviewPKR: 1080,
      occurredAt: '2026-10-27 10:48 AM',
      isLateEntry: false,
      status: 'PENDING',
      anomalyFlag: 'SPIKE_OUTPUT: 48 pcs in 6 min exceeds 2x SAM standard'
    },
    {
      id: 'ent-103',
      clientUuid: 'c-uuid-003',
      bundleId: 'BND-2026-8841-12',
      lotNumber: 'LF-2026-8841',
      operationId: 'OP-CUFF-02',
      operationName: 'Cuff & Sleeve Join',
      workerId: 'w-1105',
      workerName: 'Rashid Ali',
      workerCode: 'WF-1105',
      kioskCode: 'KSK-STITCH-01',
      channel: 'PAPER_LATE',
      qtyGood: 20,
      qtyReject: 1,
      rejectReason: 'Needle Cut',
      unitRatePKR: 18.0,
      earningsPreviewPKR: 360,
      occurredAt: '2026-10-26 04:30 PM',
      isLateEntry: true,
      lateReason: 'Paper tally sheet entered next morning after power outage',
      status: 'PENDING'
    },
    {
      id: 'ent-104',
      clientUuid: 'c-uuid-004',
      bundleId: 'BND-2026-8841-13',
      lotNumber: 'LF-2026-8841',
      operationId: 'OP-SIDE-01',
      operationName: 'Side Seam Overlock',
      workerId: 'w-1142',
      workerName: 'Bilal Hussain',
      workerCode: 'WF-1142',
      kioskCode: 'KSK-STITCH-05',
      channel: 'KIOSK',
      qtyGood: 20,
      qtyReject: 0,
      unitRatePKR: 15.0,
      earningsPreviewPKR: 300,
      occurredAt: '2026-10-27 11:15 AM',
      isLateEntry: false,
      status: 'PENDING'
    }
  ]);

  // Selected checkmarks for bulk approval
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterChannel, setFilterChannel] = useState<string>('ALL');

  // Kiosk Devices Fleet State
  const [kiosks, setKiosks] = useState<KioskDeviceItem[]>([
    {
      id: 'k-1',
      deviceCode: 'KSK-STITCH-01',
      name: 'Stitching Line 1 Front',
      department: 'Stitching Line',
      line: 'Line 1',
      location: 'Shed 2 North',
      status: 'ONLINE',
      ipAddress: '192.168.10.41',
      batteryLevel: 98,
      appVersion: '2.4.0',
      isLocked: false,
      lastHeartbeat: '1 min ago'
    },
    {
      id: 'k-2',
      deviceCode: 'KSK-STITCH-04',
      name: 'Stitching Line 4 Kurti',
      department: 'Stitching Line',
      line: 'Line 4',
      location: 'Shed 2 Center',
      status: 'ONLINE',
      ipAddress: '192.168.10.44',
      batteryLevel: 94,
      appVersion: '2.4.0',
      isLocked: false,
      lastHeartbeat: 'Just now'
    },
    {
      id: 'k-3',
      deviceCode: 'KSK-WEAVE-BAY1',
      name: 'Loom Bay Airjet Term',
      department: 'Weave Shed',
      line: 'Loom 40-48',
      location: 'Weaving Shed West',
      status: 'ONLINE',
      ipAddress: '192.168.10.51',
      batteryLevel: 100,
      appVersion: '2.4.0',
      isLocked: false,
      lastHeartbeat: '2 mins ago'
    },
    {
      id: 'k-4',
      deviceCode: 'KSK-QC-INSPECT',
      name: 'QC 4-Point Roll Frame',
      department: 'QC Inspection',
      line: 'Frame #2',
      location: 'Grey QC Hall',
      status: 'ONLINE',
      ipAddress: '192.168.10.60',
      batteryLevel: 88,
      appVersion: '2.4.0',
      isLocked: false,
      lastHeartbeat: 'Just now'
    },
    {
      id: 'k-5',
      deviceCode: 'KSK-DYE-VESSEL3',
      name: 'Jet House Terminal',
      department: 'Dye House',
      line: 'Jet 3',
      location: 'Wet Processing Bay',
      status: 'STANDBY',
      ipAddress: '192.168.10.72',
      batteryLevel: 100,
      appVersion: '2.4.0',
      isLocked: false,
      lastHeartbeat: '14 mins ago'
    }
  ]);

  // Anomalies State
  const [anomalies, setAnomalies] = useState<FloorAnomalyItem[]>([
    {
      id: 'anom-1',
      entryId: 'ent-102',
      workerName: 'Tariq Mehmood',
      workerCode: 'WF-1088',
      anomalyType: 'SPIKE_OUTPUT',
      severity: 'HIGH',
      description: 'Logged 48 pcs in under 6 minutes. Standard SAM is 1.4 min/pc (3.8x faster than standard).',
      flaggedAt: '10:48 AM Today',
      status: 'OPEN'
    },
    {
      id: 'anom-2',
      workerName: 'Naveed Akhtar',
      workerCode: 'WF-1190',
      anomalyType: 'ABSENT_OUTPUT',
      severity: 'CRITICAL',
      description: 'Worker submitted bundle scan at KSK-STITCH-02 but was NOT clocked in at the gate turnstile today.',
      flaggedAt: '09:15 AM Today',
      status: 'OPEN'
    }
  ]);

  // Late Entry Form State
  const [lateWorker, setLateWorker] = useState('WF-1042');
  const [lateBundle, setLateBundle] = useState('BND-2026-8841-99');
  const [lateOperation, setLateOperation] = useState('Collar Stitching');
  const [lateQty, setLateQty] = useState('20');
  const [lateOccurredAt, setLateOccurredAt] = useState('2026-10-26T16:00');
  const [lateReason, setLateReason] = useState('Power failure on line tablet; recorded on physical paper tally sheet');
  const [lateSuccessMessage, setLateSuccessMessage] = useState(false);

  // WhatsApp Simulator State
  const [whatsAppText, setWhatsAppText] = useState('Line A 10-11 output 140 reject 2');
  const [whatsAppParsed, setWhatsAppParsed] = useState<{
    line: string | null;
    time: string | null;
    good: number;
    reject: number;
    confidence: number;
    summary: string;
  } | null>(null);

  // 1-Click Bulk Approve for clean items
  const handleBulkApprove = () => {
    setEntries((prev) =>
      prev.map((e) => {
        if (!e.anomalyFlag && (selectedIds.length === 0 || selectedIds.includes(e.id))) {
          return { ...e, status: 'APPROVED' };
        }
        return e;
      })
    );
    setSelectedIds([]);
  };

  const handleApproveSingle = (id: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e)));
  };

  const handleRejectSingle = (id: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED', supervisorNotes: reason } : e))
      );
    }
  };

  // Submit Late Entry
  const handleSubmitLateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: FloorOutputItem = {
      id: `ent-late-${Date.now()}`,
      clientUuid: `c-uuid-${Date.now()}`,
      bundleId: lateBundle,
      lotNumber: 'LF-2026-8841',
      operationId: 'OP-LATE',
      operationName: lateOperation,
      workerId: 'w-late',
      workerName: 'Muhammad Aslam',
      workerCode: lateWorker,
      kioskCode: 'MANUAL_WEB_CLERK',
      channel: 'PAPER_LATE',
      qtyGood: parseInt(lateQty, 10),
      qtyReject: 0,
      unitRatePKR: 20.0,
      earningsPreviewPKR: parseInt(lateQty, 10) * 20.0,
      occurredAt: lateOccurredAt,
      isLateEntry: true,
      lateReason: lateReason,
      status: 'PENDING'
    };

    setEntries((prev) => [newEntry, ...prev]);
    setLateSuccessMessage(true);
    setTimeout(() => setLateSuccessMessage(false), 3000);
  };

  // Parse WhatsApp Text
  const handleSimulateWhatsApp = () => {
    let good = 0;
    let rej = 0;
    let line = 'Line A';
    let time = '10-11';

    const goodMatch = whatsAppText.match(/(?:output|prod|pcs|qty)?\s*[:=]?\s*(\d+)/i);
    if (goodMatch) good = parseInt(goodMatch[1], 10);

    const rejMatch = whatsAppText.match(/(?:reject|damage)?\s*[:=]?\s*(\d+)/i);
    if (rejMatch && whatsAppText.toLowerCase().includes('reject')) rej = parseInt(rejMatch[1], 10);

    if (whatsAppText.toLowerCase().includes('line b')) line = 'Line B';
    if (whatsAppText.toLowerCase().includes('11-12')) time = '11-12';

    setWhatsAppParsed({
      line,
      time,
      good,
      reject: rej,
      confidence: 0.92,
      summary: `Parsed Draft: ${line} • Window ${time} • Good: ${good} pcs • Rejects: ${rej} pcs`
    });
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* ─────────────────────────────────────────────────────────────
          HEADER BANNER WITH LAUNCH KIOSK ACTION
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              PROMPT #5 • SHOP-FLOOR ROLES & ENTRY CHANNELS
            </span>
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Floor Data Entry & Kiosk Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Supervisory approvals inbox, IoT machine telemetry, late paper reconciliation, and kiosk fleet control.
          </p>
        </div>

        {/* Giant Launch Fullscreen Kiosk Mode Button */}
        <button
          onClick={onLaunchKiosk}
          style={{
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#ffffff',
            padding: '0 24px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Maximize2 size={20} />
          <span>Launch Fullscreen Kiosk Mode (Floor Terminal)</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP KPI METRIC TILES
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING APPROVALS</span>
            <CheckSquare size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
            {entries.filter((e) => e.status === 'PENDING').length} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>entries</span>
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Target: &lt; 15 min supervisor cycle</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE KIOSKS / TABLETS</span>
            <Tablet size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
            {kiosks.filter((k) => k.status === 'ONLINE').length} / {kiosks.length} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>online</span>
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>100% Local LAN Edge Heartbeat</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>FLAGGED ANOMALIES</span>
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>
            {anomalies.filter((a) => a.status === 'OPEN').length} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>unresolved</span>
          </div>
          <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>Spike output & absent worker guards</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>LATE PAPER ENTRY RATE</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>
            1.8% <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>of shift</span>
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Passes &lt; 3.0% Go-Live criteria</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          NAV TABS (Approvals, Late Paper, Kiosks, Anomalies, Audit, WhatsApp)
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {[
          { key: 'approvals', label: 'Supervisor Approvals Inbox', icon: CheckSquare, badge: entries.filter((e) => e.status === 'PENDING').length },
          { key: 'late_entry', label: 'Late & Paper Entry Form', icon: Clock },
          { key: 'kiosks', label: 'Floor Tablets & Kiosk Fleet', icon: Tablet, badge: '5 Rugged' },
          { key: 'anomalies', label: 'Data Quality & Anomalies', icon: AlertTriangle, badge: anomalies.length },
          { key: 'audit', label: 'Entry Audit Trail', icon: History },
          { key: 'whatsapp', label: 'WhatsApp Bot Test Bench', icon: MessageSquare },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: isSelected ? '#3b82f6' : 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    backgroundColor: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT
         ───────────────────────────────────────────────────────────── */}

      {/* TAB 1: SUPERVISOR APPROVALS INBOX */}
      {activeTab === 'approvals' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleBulkApprove}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>1-Click Bulk Approve Clean Entries</span>
              </button>

              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Clean entries without anomalies are approved automatically.
              </span>
            </div>

            {/* Filter by Channel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                style={{
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0 10px',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Entry Channels</option>
                <option value="KIOSK">Rugged Kiosk Tablet</option>
                <option value="PAPER_LATE">Late Paper Entry</option>
                <option value="MOBILE">Operator Mobile</option>
              </select>
            </div>
          </div>

          {/* Entries Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>Worker / Lanyard</th>
                  <th style={{ padding: '12px 14px' }}>Bundle ID & Lot</th>
                  <th style={{ padding: '12px 14px' }}>Operation</th>
                  <th style={{ padding: '12px 14px' }}>Qty (Good / Rej)</th>
                  <th style={{ padding: '12px 14px' }}>Rate & Total</th>
                  <th style={{ padding: '12px 14px' }}>Channel / Time</th>
                  <th style={{ padding: '12px 14px' }}>Status & Flags</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries
                  .filter((e) => filterChannel === 'ALL' || e.channel === filterChannel)
                  .map((entry) => (
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: entry.anomalyFlag ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{entry.workerName}</div>
                        <div style={{ fontSize: '12px', color: '#38bdf8' }}>{entry.workerCode}</div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#38bdf8' }}>{entry.bundleId}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.lotNumber}</div>
                      </td>

                      <td style={{ padding: '14px', color: 'var(--text-primary)' }}>
                        <div>{entry.operationName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.operationId}</div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>{entry.qtyGood} pcs</span>
                        {entry.qtyReject > 0 && (
                          <span style={{ color: '#ef4444', marginLeft: '6px', fontWeight: 700 }}>
                            ({entry.qtyReject} rej: {entry.rejectReason})
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: '#4ade80' }}>PKR {entry.earningsPreviewPKR}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{entry.unitRatePKR}/pc</div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor: entry.channel === 'PAPER_LATE' ? '#92400e' : '#1e3a8a',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800
                            }}
                          >
                            {entry.channel}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{entry.occurredAt}</div>
                      </td>

                      <td style={{ padding: '14px' }}>
                        {entry.status === 'APPROVED' ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                            Approved ✔
                          </span>
                        ) : entry.status === 'REJECTED' ? (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                            Rejected ✖
                          </span>
                        ) : (
                          <div>
                            <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                              Pending
                            </span>
                            {entry.anomalyFlag && (
                              <div style={{ marginTop: '4px', color: '#f87171', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} /> {entry.anomalyFlag}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        {entry.status === 'PENDING' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveSingle(entry.id)}
                              style={{
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectSingle(entry.id)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LATE & PAPER ENTRY FORM */}
      {activeTab === 'late_entry' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', maxWidth: '800px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 800 }}>
              <Clock size={16} /> LATE ENTRY / PAPER RECONCILIATION CHANNEL
            </div>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Clerk & Supervisor Paper Sheet Backfill
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Entries created with this form are explicitly flagged with <code>occurred_at ≠ entered_at</code> and visible on late-entry audits.
            </p>
          </div>

          {lateSuccessMessage && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '10px', padding: '12px 16px', color: '#6ee7b7', marginBottom: '20px', fontSize: '14px', fontWeight: 700 }}>
              Late entry recorded into the audit pipeline. Supervisor approval required for payroll.
            </div>
          )}

          <form onSubmit={handleSubmitLateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Worker Code / Lanyard ID:
                </label>
                <select
                  value={lateWorker}
                  onChange={(e) => setLateWorker(e.target.value)}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                >
                  <option value="WF-1042">WF-1042 — Muhammad Aslam</option>
                  <option value="WF-1088">WF-1088 — Tariq Mehmood</option>
                  <option value="WF-1105">WF-1105 — Rashid Ali</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Bundle Barcode / Ticket:
                </label>
                <input
                  type="text"
                  value={lateBundle}
                  onChange={(e) => setLateBundle(e.target.value)}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Operation Performed:
                </label>
                <input
                  type="text"
                  value={lateOperation}
                  onChange={(e) => setLateOperation(e.target.value)}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Good Quantity Produced:
                </label>
                <input
                  type="number"
                  value={lateQty}
                  onChange={(e) => setLateQty(e.target.value)}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Original Occurrence Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={lateOccurredAt}
                  onChange={(e) => setLateOccurredAt(e.target.value)}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Mandatory Justification / Reason:
                </label>
                <input
                  type="text"
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="e.g. tablet power cut / network disruption"
                  style={{ width: '100%', height: '42px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 12px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                height: '48px',
                borderRadius: '10px',
                backgroundColor: '#d97706',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Submit Late Entry (Tagged for Audit)
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: KIOSK FLEET MANAGEMENT */}
      {activeTab === 'kiosks' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Rugged Floor Tablet Fleet & Edge Sync
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>{kiosk.deviceCode}</span>
                    <span
                      style={{
                        backgroundColor: kiosk.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: kiosk.status === 'ONLINE' ? '#10b981' : '#facc15',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      {kiosk.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {kiosk.name}
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {kiosk.department} • {kiosk.line} • {kiosk.location}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>IP:</span> {kiosk.ipAddress}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Battery:</span> {kiosk.batteryLevel}%
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>App:</span> v{kiosk.appVersion}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Ping:</span> {kiosk.lastHeartbeat}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      setKiosks((prev) =>
                        prev.map((k) => (k.id === kiosk.id ? { ...k, isLocked: !k.isLocked } : k))
                      );
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: '8px',
                      backgroundColor: kiosk.isLocked ? '#dc2626' : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {kiosk.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>{kiosk.isLocked ? 'Locked' : 'Lockdown'}</span>
                  </button>

                  <button
                    onClick={() => alert(`Remote refresh signal dispatched to ${kiosk.deviceCode}`)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    title="Send Heartbeat Ping"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DATA QUALITY & ANOMALY DASHBOARD */}
      {activeTab === 'anomalies' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Real-Time Anomaly Flags & Fraud Prevention Heuristics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '12px',
                  border: `1px solid ${anom.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      backgroundColor: anom.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '10px'
                    }}
                  >
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {anom.workerName} ({anom.workerCode})
                      </span>
                      <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                        {anom.anomalyType}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{anom.flaggedAt}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {anom.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setAnomalies((prev) => prev.filter((a) => a.id !== anom.id));
                      alert('Anomaly reviewed and verified by supervisor.');
                    }}
                    style={{
                      backgroundColor: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear / Verified
                  </button>
                  <button
                    onClick={() => {
                      setAnomalies((prev) => prev.filter((a) => a.id !== anom.id));
                      alert('Entry voided and sent for HR inquiry.');
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Void & Penalize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ENTRY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Immutable Entry Audit Trail (Old vs New Values)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { time: '11:15 AM', action: 'CREATE', user: 'KSK-STITCH-04 (Muhammad Aslam)', detail: 'Created entry for bundle BND-2026-8841-14 with 20 good pcs', ip: '192.168.10.44' },
              { time: '10:52 AM', action: 'FLAG_ANOMALY', user: 'Rule Engine (R-SAM-SPEED)', detail: 'Triggered SPIKE_OUTPUT on worker WF-1088 (48 pcs in 6m)', ip: '127.0.0.1 (FastAPI)' },
              { time: '10:48 AM', action: 'CREATE', user: 'KSK-STITCH-02 (Tariq Mehmood)', detail: 'Created entry for bundle BND-2026-8841-11 with 48 pcs', ip: '192.168.10.42' },
              { time: '09:30 AM', action: 'APPROVE', user: 'Supervisor (Farhan Qureshi)', detail: 'Approved batch of 14 clean entries on Stitching Line 1', ip: '192.168.10.15' },
              { time: '08:00 AM', action: 'BADGE_AUTH', user: 'Kiosk Gateway', detail: 'Badge WF-1042 scanned at Gate turnstile #1. Session created.', ip: '192.168.10.100' },
            ].map((log, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.time}</span>
                  <span
                    style={{
                      backgroundColor: log.action === 'CREATE' ? '#1e3a8a' : log.action === 'APPROVE' ? '#065f46' : '#7f1d1d',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.user}</span>
                  <span style={{ color: 'var(--text-muted)' }}>— {log.detail}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{log.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: WHATSAPP BOT SIMULATOR */}
      {activeTab === 'whatsapp' && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', maxWidth: '800px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', fontWeight: 800 }}>
              <MessageSquare size={16} /> WHATSAPP FALLBACK ENTRY PARSER
            </div>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Natural Language Floor Message Parser
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Simulates a supervisor sending quick WhatsApp status updates. The parser converts chat text into validated draft entries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
              placeholder="e.g. Line A 10-11 output 140 reject 2"
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0 14px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSimulateWhatsApp}
              style={{
                padding: '0 20px',
                borderRadius: '10px',
                backgroundColor: '#10b981',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              <span>Parse & Draft</span>
            </button>
          </div>

          {/* Quick Examples */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              'Line A 10-11 output 140',
              'Line B 11-12 pieces 165 reject 3',
              'Loom 42 stoppage warp break',
              'Lot 8841 bundle 12 done 20'
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setWhatsAppText(ex)}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                "{ex}"
              </button>
            ))}
          </div>

          {/* Parsed Result Card */}
          {whatsAppParsed && (
            <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '2px solid #10b981', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  NLP PARSER CONFIDENCE: {(whatsAppParsed.confidence * 100).toFixed(0)}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status: Draft Generated</span>
              </div>

              <h4 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {whatsAppParsed.summary}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Line</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>{whatsAppParsed.line || 'Line A'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Window</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{whatsAppParsed.time}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Good Qty</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>{whatsAppParsed.good} pcs</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rejects</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444' }}>{whatsAppParsed.reject} pcs</div>
                </div>
              </div>

              <button
                onClick={() => {
                  alert('WhatsApp draft confirmed and booked into production output ledger!');
                  setWhatsAppParsed(null);
                }}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Confirm & Post to Production Ledger ✔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
