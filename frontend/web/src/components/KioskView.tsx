import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Wrench,
  Scissors,
  Maximize2,
  Minimize2,
  HelpCircle,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { Card, Button, Chip, Stepper, StatusChip, DataTable, type Column } from './ui';
import { useAuth } from '../context/AuthContext';

export interface KioskProps {
  onExitKiosk?: () => void;
  defaultDepartment?: string;
  isEmbedded?: boolean;
}

// Audio Engine for mill-tested acoustic feedback
class KioskAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSuccessChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // AudioContext fallback
    }
  }

  playErrorBuzzer() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(164.81, now);
      osc.frequency.setValueAtTime(130.81, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // AudioContext fallback
    }
  }

  speakUrdu(text: string) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ur-PK';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis fallback
      }
    }
  }
}

const audio = new KioskAudioEngine();

interface RecentEntryItem {
  id: string;
  time: string;
  bundle: string;
  op: string;
  qtyGood: number;
  qtyReject: number;
  rate: number;
  earned: number;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Synced';
}

const DEFECT_REASONS = [
  { id: 'needle_cut', en: 'Needle cut', ur: 'سوئی کا کٹ' },
  { id: 'broken_thread', en: 'Broken thread', ur: 'ٹوٹا دھاگہ' },
  { id: 'oil_stain', en: 'Oil stain', ur: 'تیل کا داغ' },
  { id: 'skip_stitch', en: 'Skipped stitch', ur: 'سلائی چھوٹ' },
  { id: 'fabric_puckering', en: 'Fabric puckering', ur: 'کپڑے میں چنٹ' },
  { id: 'shade_variance', en: 'Shade variance', ur: 'شیڈ کا فرق' },
];

export const KioskView: React.FC<KioskProps> = ({
  defaultDepartment = 'Stitching',
}) => {
  const { user } = useAuth();
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Language state (default English)
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);

  // Network & Queue state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ id: string; desc: string }>>([]);

  // Auto-department assignment based on user role/department
  // Supervisors and Owners can switch departments via small dropdown
  const canSwitchDepartment =
    user?.role === 'owner' ||
    user?.role === 'super_admin' ||
    user?.role === 'production_manager' ||
    user?.role === 'supervisor';

  const [activeDept, setActiveDept] = useState<string>(
    user?.department || defaultDepartment
  );

  // Worker Session state
  const [workerSession, setWorkerSession] = useState({
    code: user?.employee_id || 'WF-1042',
    name: user?.name || 'Muhammad Aslam',
    nameUr: 'محمد اسلم',
    line: 'Line 04',
    shift: 'Shift A (08:00 - 16:00)',
    checkInTime: '08:02',
    piecesToday: 98,
    earningsToday: 1850,
    dailyTargetPieces: 120,
    targetEarnings: 2200,
  });

  // Current Bundle state
  const [scannedBundle, setScannedBundle] = useState({
    id: 'BND-2026-8841-14',
    lot: 'LF-2026-8841 (Khaadi Kurti)',
    sizeColor: 'M (Medium) • Navy Blue',
    operation: 'Collar Stitching & Front Placket',
    operationUr: 'کالر سلائی اور فرنٹ تختی',
    rate: 22.5,
    bundleTotal: 20,
  });

  const [scanCodeInput, setScanCodeInput] = useState('');
  const [completedQty, setCompletedQty] = useState(20);
  const [rejectQty, setRejectQty] = useState(0);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success banner and Undo window (15-second timer)
  const [successBanner, setSuccessBanner] = useState<{
    earned: number;
    qty: number;
    entrySnapshot: RecentEntryItem;
    remainingSeconds: number;
  } | null>(null);

  // Recent entries table
  const [recentEntries, setRecentEntries] = useState<RecentEntryItem[]>([
    {
      id: 'ent-1',
      time: '11:15 AM',
      bundle: 'BND-2026-8841-13',
      op: 'Collar Stitching',
      qtyGood: 20,
      qtyReject: 0,
      rate: 22.5,
      earned: 450,
      status: 'Approved',
    },
    {
      id: 'ent-2',
      time: '10:45 AM',
      bundle: 'BND-2026-8841-12',
      op: 'Collar Stitching',
      qtyGood: 19,
      qtyReject: 1,
      rate: 22.5,
      earned: 427.5,
      status: 'Approved',
    },
    {
      id: 'ent-3',
      time: '10:10 AM',
      bundle: 'BND-2026-8841-11',
      op: 'Collar Stitching',
      qtyGood: 20,
      qtyReject: 0,
      rate: 22.5,
      earned: 450,
      status: 'Approved',
    },
    {
      id: 'ent-4',
      time: '09:30 AM',
      bundle: 'BND-2026-8841-10',
      op: 'Collar Stitching',
      qtyGood: 19,
      qtyReject: 1,
      rate: 22.5,
      earned: 427.5,
      status: 'Pending',
    },
    {
      id: 'ent-5',
      time: '08:50 AM',
      bundle: 'BND-2026-8841-09',
      op: 'Collar Stitching',
      qtyGood: 20,
      qtyReject: 0,
      rate: 22.5,
      earned: 450,
      status: 'Synced',
    },
  ]);

  // Focus scanner input on mount
  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Countdown timer for Undo banner
  useEffect(() => {
    if (!successBanner) return;
    const interval = setInterval(() => {
      setSuccessBanner((prev) => {
        if (!prev || prev.remainingSeconds <= 1) return null;
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [successBanner]);

  // QR Barcode scanner handler
  const handleProcessScannedQR = (code: string) => {
    if (!code.trim()) return;
    audio.playSuccessChime();
    setScannedBundle({
      id: code.trim(),
      lot: 'LF-2026-8841 (Khaadi Kurti)',
      sizeColor: 'M (Medium) • Navy Blue',
      operation: 'Collar Stitching & Front Placket',
      operationUr: 'کالر سلائی اور فرنٹ تختی',
      rate: 22.5,
      bundleTotal: 20,
    });
    setCompletedQty(20);
    setRejectQty(0);
    setSelectedDefects([]);
    setScanCodeInput('');
  };

  // Submit completed entry
  const handleSubmitEntry = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const goodQty = Math.max(0, completedQty - rejectQty);
    const earned = goodQty * scannedBundle.rate;
    const newEntryId = 'ent-' + Date.now();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEntry: RecentEntryItem = {
      id: newEntryId,
      time: timeStr,
      bundle: scannedBundle.id,
      op: scannedBundle.operation,
      qtyGood: goodQty,
      qtyReject: rejectQty,
      rate: scannedBundle.rate,
      earned: earned,
      status: isOnline ? 'Approved' : 'Pending',
    };

    // Resilient offline queueing or direct submission
    try {
      if (isOnline) {
        await fetch('/api/v1/production/output-entries/submit_entry/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_uuid: newEntryId,
            bundle_id: scannedBundle.id,
            operation_id: 'OP-STITCH-01',
            operation_name: scannedBundle.operation,
            worker_id: workerSession.code,
            qty_good: goodQty,
            qty_reject: rejectQty,
            reject_reason: selectedDefects.join(', '),
            unit_rate: scannedBundle.rate,
            channel: 'KIOSK',
          }),
        });
      } else {
        setOfflineQueue((prev) => [
          ...prev,
          { id: newEntryId, desc: `Bundle ${scannedBundle.id} (${goodQty} pcs)` },
        ]);
      }
    } catch {
      // Offline fallback
      setOfflineQueue((prev) => [
        ...prev,
        { id: newEntryId, desc: `Bundle ${scannedBundle.id} (${goodQty} pcs)` },
      ]);
    }

    if (soundEnabled) {
      audio.playSuccessChime();
      if (lang === 'ur') {
        audio.speakUrdu(`ہو گیا۔ آپ نے ${earned.toFixed(0)} روپے کمائے`);
      }
    }

    // Update worker stats
    setWorkerSession((prev) => ({
      ...prev,
      piecesToday: prev.piecesToday + goodQty,
      earningsToday: prev.earningsToday + earned,
    }));

    // Prepend to recent entries table
    setRecentEntries((prev) => [newEntry, ...prev]);

    // Show inline success banner with Undo button (15 seconds window)
    setSuccessBanner({
      earned,
      qty: goodQty,
      entrySnapshot: newEntry,
      remainingSeconds: 15,
    });

    setIsSubmitting(false);

    // Prepare next bundle sequence
    const nextSeq = Math.floor(Math.random() * 80) + 15;
    setScannedBundle({
      id: `BND-2026-8841-${nextSeq}`,
      lot: 'LF-2026-8841 (Khaadi Kurti)',
      sizeColor: nextSeq % 2 === 0 ? 'L (Large) • Emerald Green' : 'M (Medium) • Navy Blue',
      operation: 'Collar Stitching & Front Placket',
      operationUr: 'کالر سلائی اور فرنٹ تختی',
      rate: 22.5,
      bundleTotal: 20,
    });
    setCompletedQty(20);
    setRejectQty(0);
    setSelectedDefects([]);

    // Refocus scanner input
    scanInputRef.current?.focus();
  };

  // Undo last submitted entry
  const handleUndo = () => {
    if (!successBanner) return;
    const { entrySnapshot, earned, qty } = successBanner;

    // Remove entry from recent entries
    setRecentEntries((prev) => prev.filter((e) => e.id !== entrySnapshot.id));

    // Revert worker stats
    setWorkerSession((prev) => ({
      ...prev,
      piecesToday: Math.max(0, prev.piecesToday - qty),
      earningsToday: Math.max(0, prev.earningsToday - earned),
    }));

    // Restore the undone bundle
    setScannedBundle({
      id: entrySnapshot.bundle,
      lot: 'LF-2026-8841 (Khaadi Kurti)',
      sizeColor: 'M (Medium) • Navy Blue',
      operation: entrySnapshot.op,
      operationUr: 'کالر سلائی اور فرنٹ تختی',
      rate: entrySnapshot.rate,
      bundleTotal: entrySnapshot.qtyGood + entrySnapshot.qtyReject,
    });
    setCompletedQty(entrySnapshot.qtyGood + entrySnapshot.qtyReject);
    setRejectQty(entrySnapshot.qtyReject);

    setSuccessBanner(null);
    audio.playErrorBuzzer();
  };

  // Global keyboard shortcuts: Enter submits, +/- adjusts, default focus to scanner
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Enter') {
        if (target.id === 'scanner-qr-input') {
          e.preventDefault();
          handleProcessScannedQR(scanCodeInput);
          return;
        }
        if (!isSubmitting) {
          e.preventDefault();
          handleSubmitEntry();
        }
      } else if (!isInput && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setCompletedQty((prev) => Math.min(60, prev + 1));
      } else if (!isInput && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setCompletedQty((prev) => Math.max(1, prev - 1));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [completedQty, isSubmitting, scanCodeInput, scannedBundle, rejectQty, selectedDefects]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle defect selection
  const handleToggleDefect = (defectId: string) => {
    setSelectedDefects((prev) => {
      const exists = prev.includes(defectId);
      const next = exists ? prev.filter((d) => d !== defectId) : [...prev, defectId];
      if (next.length > 0 && rejectQty === 0) {
        setRejectQty(1);
      } else if (next.length === 0 && rejectQty > 0) {
        setRejectQty(0);
      }
      return next;
    });
  };

  // Report problem handler
  const handleReportProblem = (type: 'mechanic' | 'material') => {
    setReportProblemOpen(false);
    audio.playSuccessChime();
    if (type === 'mechanic') {
      alert(
        lang === 'ur'
          ? 'مکینک الرٹ بھیج دیا گیا ہے (لائن ۴)'
          : 'Mechanic alert dispatched to Line 04 Floor Mechanic.'
      );
    } else {
      alert(
        lang === 'ur'
          ? 'دھاگہ و میٹریل کی درخواست اسٹور کو بھیج دی گئی ہے'
          : 'Material / Trim replenishment requested from Central Store.'
      );
    }
  };

  // Calculations
  const goodPieces = Math.max(0, completedQty - rejectQty);
  const estimatedEarning = goodPieces * scannedBundle.rate;
  const targetPct = Math.min(
    100,
    Math.round((workerSession.piecesToday / workerSession.dailyTargetPieces) * 100)
  );

  // Table columns definition
  const tableColumns: Column<RecentEntryItem>[] = [
    {
      key: 'time',
      header: lang === 'ur' ? 'وقت' : 'Time',
      width: '110px',
    },
    {
      key: 'bundle',
      header: lang === 'ur' ? 'بنڈل آئی ڈی' : 'Bundle ID',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#1E5EFF' }}>{row.bundle}</span>
      ),
    },
    {
      key: 'op',
      header: lang === 'ur' ? 'آپریشن' : 'Operation',
    },
    {
      key: 'qtyGood',
      header: lang === 'ur' ? 'تعداد (پیس)' : 'Qty',
      align: 'right',
      render: (row) => <span>{row.qtyGood} pcs</span>,
    },
    {
      key: 'qtyReject',
      header: lang === 'ur' ? 'ریجیکٹ' : 'Rejects',
      align: 'right',
      render: (row) => (
        <span style={{ color: row.qtyReject > 0 ? '#F04438' : '#6B7A90', fontWeight: 600 }}>
          {row.qtyReject}
        </span>
      ),
    },
    {
      key: 'earned',
      header: lang === 'ur' ? 'کمائی' : 'Earning',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#12B76A' }}>PKR {row.earned.toFixed(1)}</span>
      ),
    },
    {
      key: 'status',
      header: lang === 'ur' ? 'حیثیت' : 'Status',
      align: 'center',
      width: '130px',
      render: (row) => {
        const variant =
          row.status === 'Approved' || row.status === 'Synced'
            ? 'success'
            : row.status === 'Pending'
            ? 'warning'
            : 'danger';
        return <StatusChip label={row.status} variant={variant} />;
      },
    },
  ];

  const isRTL = lang === 'ur';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: '#F4F7FB',
        minHeight: '100%',
        padding: '24px',
        color: '#0B2545',
        fontFamily: isRTL
          ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', -apple-system, sans-serif"
          : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER (Breadcrumb, Title, Dropdowns, Status, Toggles)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Left: Breadcrumb & Page Title */}
        <div>
          <div
            style={{
              fontSize: '12px',
              color: '#6B7A90',
              fontWeight: 500,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Production</span>
            <span>&gt;</span>
            <span>{activeDept}</span>
            <span>&gt;</span>
            <span style={{ color: '#0B2545', fontWeight: 600 }}>Floor Entry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#0B2545',
                lineHeight: '24px',
              }}
            >
              {lang === 'ur' ? 'فلور ڈیٹا اندراج' : 'Floor Entry'}
            </h1>

            {/* Department Dropdown for Supervisors / Owners */}
            {canSwitchDepartment && (
              <div style={{ position: 'relative' }}>
                <select
                  value={activeDept}
                  onChange={(e) => setActiveDept(e.target.value)}
                  aria-label="Select Department"
                  style={{
                    appearance: 'none',
                    padding: '4px 28px 4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E5EAF2',
                    backgroundColor: '#FFFFFF',
                    color: '#0B2545',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    height: '32px',
                  }}
                >
                  <option value="Stitching">Stitching</option>
                  <option value="Weaving">Weaving</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Dyeing">Dyeing</option>
                </select>
                <ChevronDown
                  size={14}
                  color="#6B7A90"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '9px',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Connection status, Report problem, Lang, Fullscreen, Help */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Connection Status Chip */}
          <StatusChip
            label={
              isOnline
                ? lang === 'ur'
                  ? 'آن لائن'
                  : 'Online'
                : lang === 'ur'
                ? `آف لائن • قطار ${offlineQueue.length}`
                : `Offline - queued ${offlineQueue.length}`
            }
            variant={isOnline ? 'success' : 'warning'}
            onClick={() => {
              setIsOnline(!isOnline);
              if (isOnline) {
                setOfflineQueue([{ id: 'off-1', desc: 'Queued item' }]);
              } else {
                setOfflineQueue([]);
              }
            }}
            style={{ cursor: 'pointer', height: '36px' }}
          />

          {/* Report Problem Dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportProblemOpen(!reportProblemOpen)}
              icon={<AlertTriangle size={15} color="#F79009" />}
              aria-label="Report problem options"
            >
              <span>{lang === 'ur' ? 'مسئلہ رپورٹ کریں' : 'Report problem'}</span>
              <ChevronDown size={14} color="#6B7A90" />
            </Button>

            {reportProblemOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: isRTL ? 'auto' : 0,
                  left: isRTL ? 0 : 'auto',
                  top: '100%',
                  marginTop: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5EAF2',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(11, 37, 69, 0.1)',
                  zIndex: 50,
                  minWidth: '180px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleReportProblem('mechanic')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#0B2545',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F7FB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Wrench size={15} color="#F04438" />
                  <span>{lang === 'ur' ? 'مکینک بلائیں' : 'Call mechanic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportProblem('material')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    borderTop: '1px solid #E5EAF2',
                    backgroundColor: 'transparent',
                    color: '#0B2545',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F7FB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Scissors size={15} color="#F79009" />
                  <span>{lang === 'ur' ? 'دھاگہ و سامان مانگیں' : 'Request material'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="Toggle sound chimes"
            title="Toggle acoustic feedback"
          >
            {soundEnabled ? <Volume2 size={16} color="#1E5EFF" /> : <VolumeX size={16} color="#6B7A90" />}
          </Button>

          {/* Language Toggle (EN | اردو) */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5EAF2',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '36px',
            }}
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                border: 'none',
                padding: '0 12px',
                backgroundColor: lang === 'en' ? '#1E5EFF' : '#FFFFFF',
                color: lang === 'en' ? '#FFFFFF' : '#6B7A90',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              style={{
                border: 'none',
                padding: '0 12px',
                backgroundColor: lang === 'ur' ? '#1E5EFF' : '#FFFFFF',
                color: lang === 'ur' ? '#FFFFFF' : '#6B7A90',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Noto Nastaliq Urdu', serif",
                transition: 'all 0.15s ease',
              }}
            >
              اردو
            </button>
          </div>

          {/* Fullscreen Button (optional for tablets, default embedded) */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 size={16} color="#6B7A90" /> : <Maximize2 size={16} color="#6B7A90" />}
          </Button>

          {/* Help Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            icon={<HelpCircle size={15} color="#6B7A90" />}
            aria-label="Help"
          >
            <span>{lang === 'ur' ? 'رہنمائی' : 'Help'}</span>
          </Button>
        </div>
      </div>

      {/* Help Modal / Drawer */}
      {isHelpOpen && (
        <Card
          padding="md"
          style={{
            marginBottom: '20px',
            backgroundColor: '#EFF8FF',
            borderColor: '#B2DDFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#175CD3' }}>
                {lang === 'ur' ? 'فلور ڈیٹا اینٹری کے شارٹ کٹس' : 'Floor Data Entry Keyboard Guide & Shortcuts'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#1E40AF', lineHeight: '18px' }}>
                {lang === 'ur'
                  ? 'انٹر (Enter) دبائیں اندراج جمع کرنے کے لیے • جمع (+) یا نفی (-) دبائیں مقدار بدلنے کے لیے • بارکوڈ اسکینر خودکار طور پر تیار ہے۔'
                  : 'Press Enter to submit entry • Use + or - keys to adjust completed quantity • Present QR code directly to auto-load bundle details • Undo button is available for 15 seconds after saving.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsHelpOpen(false)}>
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. WORKER SUMMARY BAR (White Card, Avatar, ID, Shift, 3 Stats)
         ───────────────────────────────────────────────────────────── */}
      <Card padding="md" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Worker Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Avatar with Initials */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: '#EFF4FF',
                border: '1px solid #D1E0FF',
                color: '#1E5EFF',
                fontWeight: 700,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {workerSession.name[0]}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#0B2545',
                  }}
                >
                  {lang === 'ur' ? workerSession.nameUr : workerSession.name}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7A90',
                    backgroundColor: '#F8FAFC',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E5EAF2',
                  }}
                >
                  {workerSession.code}
                </span>
                <StatusChip
                  label={
                    lang === 'ur'
                      ? `حاضری درج ${workerSession.checkInTime}`
                      : `Checked in ${workerSession.checkInTime}`
                  }
                  variant="success"
                  showDot={true}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#6B7A90', marginTop: '3px' }}>
                {workerSession.line} • {workerSession.shift}
              </div>
            </div>
          </div>

          {/* 3 Stats: Pieces today, Earnings today, Target progress */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              flexWrap: 'wrap',
            }}
          >
            {/* Stat 1: Pieces today */}
            <div>
              <div style={{ fontSize: '12px', color: '#6B7A90', fontWeight: 500 }}>
                {lang === 'ur' ? 'آج کے پیس' : 'Pieces today'}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#0B2545',
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: '2px',
                }}
              >
                {workerSession.piecesToday}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7A90' }}>pcs</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '36px', backgroundColor: '#E5EAF2' }} />

            {/* Stat 2: Earnings today */}
            <div>
              <div style={{ fontSize: '12px', color: '#6B7A90', fontWeight: 500 }}>
                {lang === 'ur' ? 'آج کی کل کمائی' : 'Earnings today'}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#12B76A',
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: '2px',
                }}
              >
                PKR {workerSession.earningsToday.toLocaleString()}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '36px', backgroundColor: '#E5EAF2' }} />

            {/* Stat 3: Target progress (bar) */}
            <div style={{ minWidth: '180px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6B7A90',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                <span>{lang === 'ur' ? 'ہدف کی پیش رفت' : 'Target progress'}</span>
                <span style={{ fontWeight: 600, color: '#0B2545' }}>
                  {workerSession.piecesToday} / {workerSession.dailyTargetPieces} ({targetPct}%)
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: '#E5EAF2',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${targetPct}%`,
                    backgroundColor: '#1E5EFF',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          INLINE SUCCESS / UNDO BANNER (Shows after submission)
         ───────────────────────────────────────────────────────────── */}
      {successBanner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#ECFDF3',
            border: '1px solid #D1FADF',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(11, 37, 69, 0.05)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#12B76A" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#027A48' }}>
              {lang === 'ur'
                ? `اندراج محفوظ ہو گیا — +PKR ${successBanner.earned.toFixed(0)} (${successBanner.qty} پیس)`
                : `Entry saved — +PKR ${successBanner.earned.toFixed(0)} (${successBanner.qty} pcs)`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#027A48' }}>
              {successBanner.remainingSeconds}s
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              icon={<RotateCcw size={14} />}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#A6F4C5',
                color: '#027A48',
              }}
            >
              {lang === 'ur' ? 'منسوخ (Undo)' : 'Undo'}
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ROW (8 / 4 Split): Current Bundle & Rejects
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* ── LEFT CARD: CURRENT BUNDLE (Takes 2 fractions on desktop) ── */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card
            title={lang === 'ur' ? 'موجودہ بنڈل' : 'Current Bundle'}
            subtitle={
              lang === 'ur'
                ? 'کیو آر اسکین کریں اور مکمل شدہ تعداد درج کریں'
                : 'Scan QR barcode and confirm completed quantity'
            }
            headerAction={
              <StatusChip
                label={`PKR ${scannedBundle.rate.toFixed(1)} / pc`}
                variant="info"
                showDot={false}
              />
            }
            padding="md"
          >
            {/* Scan Box / Scanner-ready indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5EAF2',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#EFF4FF',
                  border: '1px solid #D1E0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E5EFF',
                  flexShrink: 0,
                }}
              >
                <QrCode size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <input
                  ref={scanInputRef}
                  id="scanner-qr-input"
                  type="text"
                  placeholder={
                    lang === 'ur'
                      ? 'بنڈل QR اسکین کریں یا آئی ڈی درج کریں...'
                      : 'Scan bundle QR or enter barcode ID...'
                  }
                  value={scanCodeInput}
                  onChange={(e) => setScanCodeInput(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                    color: '#0B2545',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Scanner Ready Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#12B76A',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7A90' }}>
                  {lang === 'ur' ? 'اسکینر تیار' : 'Scanner Ready'}
                </span>
              </div>
            </div>

            {/* Bundle Details Grid (4 items) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {/* Bundle ID */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E5EAF2',
                }}
              >
                <div style={{ fontSize: '12px', color: '#6B7A90' }}>
                  {lang === 'ur' ? 'بنڈل آئی ڈی' : 'Bundle ID'}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1E5EFF',
                    marginTop: '2px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {scannedBundle.id}
                </div>
              </div>

              {/* Lot / Order */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E5EAF2',
                }}
              >
                <div style={{ fontSize: '12px', color: '#6B7A90' }}>
                  {lang === 'ur' ? 'لاٹ / آرڈر' : 'Lot / Order'}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0B2545',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {scannedBundle.lot}
                </div>
              </div>

              {/* Size & Color */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E5EAF2',
                }}
              >
                <div style={{ fontSize: '12px', color: '#6B7A90' }}>
                  {lang === 'ur' ? 'سائز و رنگ' : 'Size / Colour'}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0B2545',
                    marginTop: '2px',
                  }}
                >
                  {scannedBundle.sizeColor}
                </div>
              </div>

              {/* Operation */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E5EAF2',
                }}
              >
                <div style={{ fontSize: '12px', color: '#6B7A90' }}>
                  {lang === 'ur' ? 'آپریشن' : 'Operation'}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0B2545',
                    marginTop: '2px',
                  }}
                >
                  {lang === 'ur' ? scannedBundle.operationUr : scannedBundle.operation}
                </div>
              </div>
            </div>

            {/* Quantity Completed Section */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0B2545',
                  }}
                >
                  {lang === 'ur' ? 'مکمل شدہ مقدار:' : 'Quantity completed:'}
                </label>

                {/* Estimated Earning Display */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#12B76A',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {lang === 'ur' ? 'متوقع کمائی: ' : 'Estimated earning: '}
                  PKR {estimatedEarning.toFixed(1)}
                </span>
              </div>

              {/* Large Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Stepper
                  value={completedQty}
                  onChange={(val) => setCompletedQty(val)}
                  min={1}
                  max={60}
                  unit="pcs"
                  size="lg"
                  aria-label="Quantity completed stepper"
                />

                {/* Quick Chips (5, 10, 15, 20, 25, 30) */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30].map((num) => (
                    <Chip
                      key={num}
                      selected={completedQty === num}
                      onClick={() => setCompletedQty(num)}
                    >
                      {num}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Submit Entry Button (Full width, Blue #1E5EFF, 48px) */}
            <Button
              variant="primary"
              size="lg"
              fullWidth={true}
              isLoading={isSubmitting}
              onClick={handleSubmitEntry}
              icon={<CheckCircle2 size={18} />}
              style={{
                height: '48px',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {lang === 'ur'
                ? `اندراج محفوظ کریں (${goodPieces} پیس) — +PKR ${estimatedEarning.toFixed(0)}`
                : `Submit entry (${goodPieces} pcs) — +PKR ${estimatedEarning.toFixed(0)}`}
            </Button>
          </Card>
        </div>

        {/* ── RIGHT CARD: REJECTS / DEFECTS (Takes 1 fraction on desktop) ── */}
        <div>
          <Card
            title={lang === 'ur' ? 'خراب پیس و نقائص' : 'Rejects / Defects'}
            subtitle={
              lang === 'ur'
                ? 'اگر کوئی پیس خراب ہے تو وجہ منتخب کریں'
                : 'Select reason if any piece is rejected'
            }
            padding="md"
          >
            {/* Reject Quantity Stepper */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5EAF2',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0B2545' }}>
                {lang === 'ur' ? 'خراب پیس تعداد:' : 'Reject quantity:'}
              </span>
              <Stepper
                value={rejectQty}
                onChange={(val) => {
                  setRejectQty(val);
                  if (val === 0) setSelectedDefects([]);
                  else if (selectedDefects.length === 0) setSelectedDefects(['needle_cut']);
                }}
                min={0}
                max={completedQty}
                size="md"
                aria-label="Reject quantity stepper"
              />
            </div>

            {/* Helper Text */}
            <div
              style={{
                fontSize: '12px',
                color: '#6B7A90',
                marginBottom: '12px',
              }}
            >
              {lang === 'ur'
                ? 'نقص کی وجوہات منتخب کریں:'
                : 'Select reason if any piece is rejected'}
            </div>

            {/* Defect Reason Chips (Selectable outlined chips >=44px touch target) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEFECT_REASONS.map((defect) => {
                const isSelected = selectedDefects.includes(defect.id);
                return (
                  <Chip
                    key={defect.id}
                    variant={isSelected ? 'danger' : 'neutral'}
                    selected={isSelected}
                    onClick={() => handleToggleDefect(defect.id)}
                    style={{
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                    }}
                  >
                    <span>{lang === 'ur' ? defect.ur : defect.en}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: isSelected ? '#F04438' : '#6B7A90',
                        fontWeight: 600,
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM ROW: RECENT ENTRIES TABLE (Full Width)
         ───────────────────────────────────────────────────────────── */}
      <Card
        title={lang === 'ur' ? 'حالیہ اندراجات' : 'Recent entries'}
        subtitle={
          lang === 'ur'
            ? 'آج کی مکمل شدہ بنڈل اینٹریز اور تصدیق کی کیفیت'
            : 'Today’s completed bundle production records and approval audit'
        }
        padding="md"
      >
        <DataTable
          columns={tableColumns}
          data={recentEntries}
          keyExtractor={(row) => row.id}
          emptyMessage={
            lang === 'ur' ? 'آج کوئی اندراج نہیں کیا گیا' : 'No entries submitted yet today'
          }
        />
      </Card>
    </div>
  );
};

// Also export as FloorEntryView for seamless modular usage
export const FloorEntryView = KioskView;
