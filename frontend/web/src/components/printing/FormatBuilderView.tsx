import React, { useState } from 'react';
import {
  Printer,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Type,
  Table as TableIcon,
  QrCode,
  Barcode,
  PenTool,
  Move,
  ZoomIn,
  ZoomOut,
  Copy,
  Trash2,
  ShieldCheck,
  Search,
  Globe
} from 'lucide-react';

export interface LayoutElement {
  id: string;
  type: string;
  x: number; // in mm
  y: number; // in mm
  w: number; // in mm
  h: number; // in mm
  label?: string;
  title?: string;
  subtitle?: string;
  value?: string;
  collection?: string;
  columns?: { field: string; header: string; width: string; align: string; format?: string }[];
  boxes?: string[];
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: string;
  isRtl?: boolean;
}

interface FormatBuilderProps {
  onBack?: () => void;
}

export const FormatBuilderView: React.FC<FormatBuilderProps> = ({ onBack }) => {
  // Available Document Types
  const docTypes = [
    { code: 'INVOICE', name: 'Tax / Sales Invoice', defaultPaper: 'A4', category: 'Sales' },
    { code: 'DELIVERY_CHALLAN', name: 'Delivery Challan & Dispatch POD', defaultPaper: 'A4', category: 'Logistics' },
    { code: 'GATE_PASS_OUT', name: 'Gate Pass — Material OUT', defaultPaper: 'HALF_A4', category: 'Logistics' },
    { code: 'GATE_PASS_IN', name: 'Gate Pass — Material IN', defaultPaper: 'HALF_A4', category: 'Logistics' },
    { code: 'RECEIPT', name: 'Official Payment Receipt', defaultPaper: 'HALF_A4', category: 'Finance' },
    { code: 'STATEMENT', name: 'Party Account Statement & Aging', defaultPaper: 'A4', category: 'Finance' },
    { code: 'PAYSLIP', name: 'Monthly Employee Payslip', defaultPaper: 'A5', category: 'HR' },
    { code: 'JOB_CARD', name: 'Production Order & Job Card', defaultPaper: 'A4', category: 'Production' },
    { code: 'DYE_BATCH_CARD', name: 'Dyeing Recipe & Batch Card', defaultPaper: 'A4', category: 'Production' },
    { code: 'BUNDLE_TICKET', name: 'Stitching Bundle QR Ticket', defaultPaper: 'LABEL_75X50', category: 'Labels' },
    { code: 'WEIGHBRIDGE_SLIP', name: 'Weighbridge Gross/Tare Slip', defaultPaper: 'THERMAL_80MM', category: 'Logistics' }
  ];

  const paperPresets: Record<string, { name: string; w: number; h: number }> = {
    A4: { name: 'A4 (210 × 297 mm)', w: 210, h: 297 },
    A5: { name: 'A5 (148 × 210 mm)', w: 148, h: 210 },
    A3: { name: 'A3 Wide (297 × 420 mm)', w: 420, h: 297 },
    HALF_A4: { name: 'Half A4 Landscape (210 × 148 mm)', w: 210, h: 148 },
    THERMAL_80MM: { name: 'Thermal 80mm Roll (80 × 160 mm)', w: 80, h: 160 },
    LABEL_75X50: { name: 'Bundle Label (75 × 50 mm)', w: 75, h: 50 },
    CR80_ID: { name: 'ID Card CR80 (85.6 × 54 mm)', w: 85.6, h: 54 }
  };

  // State
  const [selectedDocCode, setSelectedDocCode] = useState('INVOICE');
  const [activePaper, setActivePaper] = useState('A4');
  const [zoom, setZoom] = useState(100);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [templateStatus, setTemplateStatus] = useState<'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE'>('ACTIVE');
  const [versionNo, setVersionNo] = useState(1);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-heading');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [approvalBanner, setApprovalBanner] = useState<string | null>(null);
  const [variableSearch, setVariableSearch] = useState('');

  // Sample Elements for Invoice Layout
  const [elements, setElements] = useState<LayoutElement[]>([
    { id: 'el-heading', type: 'heading', x: 12, y: 10, w: 186, h: 20, title: 'TAX / SALES INVOICE', subtitle: 'Sales Tax Registered Under Sales Tax Act 1990' },
    { id: 'el-company', type: 'company_block', x: 12, y: 32, w: 90, h: 26 },
    { id: 'el-doc-meta', type: 'doc_meta', x: 110, y: 32, w: 88, h: 26 },
    { id: 'el-party', type: 'party_block', x: 12, y: 62, w: 186, h: 26 },
    {
      id: 'el-table',
      type: 'table',
      x: 12,
      y: 92,
      w: 186,
      h: 60,
      collection: 'items',
      columns: [
        { field: 'line_no', header: 'Sr#', width: '6%', align: 'center' },
        { field: 'code', header: 'Item Code', width: '14%', align: 'left' },
        { field: 'description', header: 'Description & Specs', width: '36%', align: 'left' },
        { field: 'qty', header: 'Qty', width: '10%', align: 'right' },
        { field: 'uom', header: 'UoM', width: '8%', align: 'center' },
        { field: 'rate', header: 'Rate (PKR)', width: '12%', align: 'right', format: 'money' },
        { field: 'amount', header: 'Amount (PKR)', width: '14%', align: 'right', format: 'money' }
      ]
    },
    { id: 'el-words', type: 'words_block', x: 12, y: 156, w: 96, h: 24 },
    { id: 'el-totals', type: 'totals_block', x: 112, y: 156, w: 86, h: 36 },
    { id: 'el-bank', type: 'bank_block', x: 12, y: 184, w: 96, h: 24 },
    { id: 'el-signatures', type: 'signatures', x: 12, y: 220, w: 186, h: 20, boxes: ['Prepared By', 'Checked By', 'Approved By', 'Receiver Ack'] },
    { id: 'el-qr', type: 'qr_verify', x: 168, y: 194, w: 30, h: 26 }
  ]);

  const selectedElement = elements.find((e) => e.id === selectedElementId);
  const currentPaper = paperPresets[activePaper] || paperPresets.A4;

  // Scale: 1 mm = ~3.2 pixels at 100% zoom
  const mmToPx = (mm: number) => (mm * 3.2 * (zoom / 100));

  // Add Element to Canvas
  const handleAddElement = (type: string, label: string) => {
    const newId = `el-${Date.now()}`;
    const newEl: LayoutElement = {
      id: newId,
      type: type,
      x: 12,
      y: 30 + elements.length * 6,
      w: type === 'qr_verify' || type === 'barcode' ? 30 : 186,
      h: type === 'table' ? 50 : 20,
      title: label,
      label: label,
      fontSize: 9,
      align: 'left'
    };

    setElements([...elements, newEl]);
    setSelectedElementId(newId);
  };

  // Update selected element property
  const handleUpdateElement = (field: keyof LayoutElement, val: any) => {
    if (!selectedElementId) return;
    setElements(elements.map((el) => (el.id === selectedElementId ? { ...el, [field]: val } : el)));
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    setElements(elements.filter((e) => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Duplicate element
  const handleDuplicateElement = (el: LayoutElement) => {
    const clone: LayoutElement = {
      ...el,
      id: `el-${Date.now()}`,
      x: el.x + 4,
      y: el.y + 4
    };
    setElements([...elements, clone]);
    setSelectedElementId(clone.id);
  };

  // Save template version
  const handleSaveTemplate = async () => {
    setSaveSuccessBanner(true);
    setVersionNo((v) => v + 1);
    setTimeout(() => setSaveSuccessBanner(false), 3000);
  };

  // Approval workflow
  const handleSubmitApproval = () => {
    setTemplateStatus('PENDING_APPROVAL');
    setApprovalBanner('Template submitted to Quality & Compliance Head for print authorization.');
    setTimeout(() => setApprovalBanner(null), 4000);
  };

  const handleApproveTemplate = () => {
    setTemplateStatus('ACTIVE');
    setApprovalBanner('Template approved and marked ACTIVE as official mill print format.');
    setTimeout(() => setApprovalBanner(null), 4000);
  };

  // Live preview
  const handleTriggerLivePreview = () => {
    setPreviewModalOpen(true);
  };

  // Data dictionary tree
  const variableCategories = [
    {
      category: 'Company Profile (company.*)',
      vars: [
        { key: '{{ company.name }}', desc: 'Mill Enterprise Name' },
        { key: '{{ company.address }}', desc: 'Official Factory / Head Office Address' },
        { key: '{{ company.ntn }}', desc: 'FBR National Tax Number' },
        { key: '{{ company.strn }}', desc: 'Sales Tax Registration Number' },
        { key: '{{ company.phone }}', desc: 'Exchange Phone Line' },
        { key: '{{ company.email }}', desc: 'Finance / Accounts Email' },
        { key: '{{ company.bank_iban }}', desc: 'Official Remittance IBAN' }
      ]
    },
    {
      category: 'Document Details (doc.*)',
      vars: [
        { key: '{{ doc.number }}', desc: 'Auto Generated Document #' },
        { key: '{{ doc.date }}', desc: 'Issuance Date (DD-MMM-YYYY)' },
        { key: '{{ doc.due_date }}', desc: 'Payment / Delivery Expiry' },
        { key: '{{ doc.copy_label }}', desc: 'Original / Duplicate Copy Label' },
        { key: '{{ doc.printed_by }}', desc: 'Authorised User Stamp' },
        { key: '{{ doc.reprint_text }}', desc: 'REPRINT # Mark for Audits' }
      ]
    },
    {
      category: 'Party / Client (party.*)',
      vars: [
        { key: '{{ party.name }}', desc: 'Client / Supplier Commercial Name' },
        { key: '{{ party.address }}', desc: 'Billing / Factory Site Address' },
        { key: '{{ party.ntn }}', desc: 'Buyer NTN' },
        { key: '{{ party.strn }}', desc: 'Buyer STRN' },
        { key: '{{ party.contact_person }}', desc: 'Attention Officer' },
        { key: '{{ party.phone }}', desc: 'Direct WhatsApp / Mobile' }
      ]
    },
    {
      category: 'Totals & In Words (totals.*)',
      vars: [
        { key: '{{ totals.subtotal | money }}', desc: 'Net Taxable Subtotal (PKR)' },
        { key: '{{ totals.tax_rate }}', desc: 'Sales Tax Percentage (18%)' },
        { key: '{{ totals.tax_amount | money }}', desc: 'Sales Tax Value' },
        { key: '{{ totals.grand_total | money }}', desc: 'Payable Invoice Total' },
        { key: '{{ totals.in_words_en }}', desc: 'Amount in Words (English)' },
        { key: '{{ totals.in_words_ur }}', desc: 'Amount in Words (Urdu Nastaliq)' }
      ]
    },
    {
      category: 'Logistics & Gate (transport.*)',
      vars: [
        { key: '{{ transport.vehicle_no }}', desc: 'Truck / Rickshaw Registration #' },
        { key: '{{ transport.driver_name }}', desc: 'Driver Full Name' },
        { key: '{{ transport.driver_cnic }}', desc: 'Driver CNIC Number' },
        { key: '{{ transport.transporter }}', desc: 'Carriage Goods Company' }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* ── TOP NAV / TOOLBAR ──────────────────────────────────────────────── */}
      <header style={{
        height: '62px',
        backgroundColor: '#0b2545',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50
      }}>
        {/* Left: Template Selector & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ← Back
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Printer size={22} color="#38bdf8" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                  Print Format Designer
                </span>
                <span style={{
                  backgroundColor: templateStatus === 'ACTIVE' ? '#10b981' : templateStatus === 'PENDING_APPROVAL' ? '#f59e0b' : '#64748b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  {templateStatus} • v{versionNo}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: '28px', width: '1px', backgroundColor: '#334155' }} />

          {/* Doc Type Selector */}
          <select
            value={selectedDocCode}
            onChange={(e) => {
              setSelectedDocCode(e.target.value);
              const found = docTypes.find((d) => d.code === e.target.value);
              if (found) setActivePaper(found.defaultPaper);
            }}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {docTypes.map((dt) => (
              <option key={dt.code} value={dt.code}>
                {dt.category}: {dt.name}
              </option>
            ))}
          </select>

          {/* Paper Preset Selector */}
          <select
            value={activePaper}
            onChange={(e) => setActivePaper(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            {Object.entries(paperPresets).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Canvas View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', minWidth: '44px', textAlign: 'center' }}>
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 15))}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            style={{
              backgroundColor: snapToGrid ? '#1e5eff' : '#1e293b',
              border: '1px solid #334155',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Grid Snap {snapToGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleTriggerLivePreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Eye size={16} />
            <span>Preview Mode</span>
          </button>

          {templateStatus === 'DRAFT' && (
            <button
              onClick={handleSubmitApproval}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#d97706',
                border: 'none',
                color: '#ffffff',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Clock size={16} />
              <span>Submit for Approval</span>
            </button>
          )}

          {templateStatus === 'PENDING_APPROVAL' && (
            <button
              onClick={handleApproveTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#10b981',
                border: 'none',
                color: '#ffffff',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Approve & Publish</span>
            </button>
          )}

          <button
            onClick={handleSaveTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e5eff',
              border: 'none',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 94, 255, 0.35)'
            }}
          >
            <Save size={16} />
            <span>Save Version</span>
          </button>
        </div>
      </header>

      {/* Toast Notification Banners */}
      {saveSuccessBanner && (
        <div style={{ backgroundColor: '#065f46', color: '#a7f3d0', padding: '8px 20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span>Template layout saved successfully! Version {versionNo} created with checksum integrity.</span>
        </div>
      )}
      {approvalBanner && (
        <div style={{ backgroundColor: '#1e3a8a', color: '#bfdbfe', padding: '8px 20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#60a5fa" />
          <span>{approvalBanner}</span>
        </div>
      )}

      {/* ── MAIN STUDIO BODY ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ── LEFT PANEL: PALETTE OF ELEMENTS ──────────────────────────────── */}
        <aside style={{
          width: '260px',
          backgroundColor: '#131b2e',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
            LAYOUT COMPONENTS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { type: 'heading', label: 'Document Title Bar', icon: Type },
              { type: 'company_block', label: 'Company Letterhead', icon: Layers },
              { type: 'doc_meta', label: 'Document Meta Grid', icon: FileText },
              { type: 'party_block', label: 'Bill To / Consignee', icon: FileText },
              { type: 'table', label: 'Repeating Data Table', icon: TableIcon },
              { type: 'totals_block', label: 'Totals & Tax Breakdown', icon: FileText },
              { type: 'words_block', label: 'Bilingual Amount in Words', icon: Globe },
              { type: 'bank_block', label: 'Bank Account & Terms', icon: FileText },
              { type: 'signatures', label: 'Authorised Signatures Row', icon: PenTool },
              { type: 'qr_verify', label: 'Signed Verification QR', icon: QrCode },
              { type: 'barcode', label: 'Code128 Barcode', icon: Barcode },
              { type: 'transport_block', label: 'Transport / Vehicle Log', icon: FileText },
              { type: 'divider', label: 'Divider Rule Line', icon: Move }
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddElement(item.type, item.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border 0.2s, background 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1e5eff')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
              >
                <item.icon size={16} color="#38bdf8" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Info Box */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#64748b' }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Pixel-Accurate Standard:</div>
            <div>All blocks position by mm coordinates. Renders through WeasyPrint CSS @page specification with automatic repeating table headers.</div>
          </div>
        </aside>

        {/* ── CENTER: MM-ACCURATE CANVAS ───────────────────────────────────── */}
        <main style={{
          flex: 1,
          backgroundColor: '#090d16',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
          position: 'relative'
        }}>
          {/* Paper Canvas */}
          <div
            style={{
              width: `${mmToPx(currentPaper.w)}px`,
              minHeight: `${mmToPx(currentPaper.h)}px`,
              backgroundColor: '#ffffff',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
              borderRadius: '2px',
              position: 'relative',
              color: '#0f172a',
              transition: 'transform 0.15s ease',
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Print Safe Margin Overlay (Dashed Line) */}
            <div style={{
              position: 'absolute',
              top: `${mmToPx(10)}px`,
              left: `${mmToPx(12)}px`,
              right: `${mmToPx(12)}px`,
              bottom: `${mmToPx(12)}px`,
              border: '1px dashed #bfdbfe',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Elements Layer */}
            {elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${mmToPx(el.x)}px`,
                    top: `${mmToPx(el.y)}px`,
                    width: `${mmToPx(el.w)}px`,
                    minHeight: `${mmToPx(el.h)}px`,
                    outline: isSelected ? '2px solid #1e5eff' : '1px dashed rgba(148, 163, 184, 0.3)',
                    backgroundColor: isSelected ? 'rgba(30, 94, 255, 0.04)' : 'transparent',
                    cursor: 'move',
                    zIndex: isSelected ? 10 : 2,
                    padding: '2px'
                  }}
                >
                  {/* Coordinate Tag when selected */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '0',
                      backgroundColor: '#1e5eff',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}>
                      {el.type.toUpperCase()} • x:{el.x}mm y:{el.y}mm w:{el.w}mm
                    </div>
                  )}

                  {/* Visual Render of Block */}
                  {el.type === 'heading' && (
                    <div style={{ borderBottom: '2px solid #0b2545', paddingBottom: '4px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#0b2545' }}>{el.title}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{el.subtitle}</div>
                    </div>
                  )}

                  {el.type === 'company_block' && (
                    <div style={{ fontSize: '10px', color: '#334155', lineHeight: '1.3' }}>
                      <strong style={{ fontSize: '12px', color: '#0b2545' }}>Lahore Fashion Textile Mills Ltd.</strong>
                      <div>Plot 42-A, Sundar Industrial Estate, Lahore</div>
                      <div>NTN: 2849102-4 • STRN: 1700284910219</div>
                    </div>
                  )}

                  {el.type === 'doc_meta' && (
                    <div style={{ fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', background: '#f8fafc' }}>
                      <div>Doc #: <strong>INV-2026-0842</strong></div>
                      <div>Date: <strong>27-Oct-2026</strong></div>
                      <span style={{ background: '#1e5eff', color: '#ffffff', padding: '1px 4px', borderRadius: '2px', fontSize: '9px', fontWeight: 700 }}>ORIGINAL</span>
                    </div>
                  )}

                  {el.type === 'party_block' && (
                    <div style={{ fontSize: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>BILL TO:</span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0b2545' }}>Khaadi Apparel (Pvt) Ltd</div>
                      <div>SITE Area, Karachi • NTN: 1428590-3</div>
                    </div>
                  )}

                  {el.type === 'table' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                      <thead>
                        <tr style={{ background: '#0b2545', color: '#ffffff' }}>
                          {el.columns?.map((col, idx) => (
                            <th key={idx} style={{ padding: '4px 6px', textAlign: col.align as any, width: col.width }}>
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '4px 6px' }}>FAB-LWN-01</td>
                          <td style={{ padding: '4px 6px' }}>Cotton Lawn 80x80 Printed</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right' }}>3,000</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>Mtr</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right' }}>280.00</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>840,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {el.type === 'totals_block' && (
                    <div style={{ fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><strong>PKR 840,000</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sales Tax (18%):</span><strong>PKR 151,200</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0b2545', marginTop: '4px', paddingTop: '4px' }}>
                        <strong style={{ color: '#0b2545' }}>Grand Total:</strong>
                        <strong style={{ color: '#0b2545' }}>PKR 991,200</strong>
                      </div>
                    </div>
                  )}

                  {el.type === 'words_block' && (
                    <div style={{ fontSize: '9px', borderLeft: '2px solid #1e5eff', paddingLeft: '6px' }}>
                      <strong>Amount in Words:</strong>
                      <div>Rupees Nine Hundred Ninety-One Thousand Two Hundred Only</div>
                      <div style={{ fontFamily: '"Noto Nastaliq Urdu", serif', direction: 'rtl', textAlign: 'right', marginTop: '2px' }}>
                        نو لاکھ اکانوے ہزار دو سو روپے فقط
                      </div>
                    </div>
                  )}

                  {el.type === 'signatures' && (
                    <div style={{ display: 'flex', gap: '8px', textAlign: 'center' }}>
                      {el.boxes?.map((b, idx) => (
                        <div key={idx} style={{ flex: 1, borderTop: '1px solid #64748b', paddingTop: '2px', fontSize: '9px', fontWeight: 700 }}>
                          {b}
                        </div>
                      ))}
                    </div>
                  )}

                  {el.type === 'qr_verify' && (
                    <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px', borderRadius: '4px', width: 'fit-content' }}>
                      <QrCode size={36} color="#0b2545" />
                      <div style={{ fontSize: '7px', color: '#64748b' }}>Scan to Verify</div>
                    </div>
                  )}

                  {el.type === 'barcode' && (
                    <div style={{ textAlign: 'center' }}>
                      <Barcode size={36} color="#0b2545" />
                      <div style={{ fontSize: '8px', fontFamily: 'monospace' }}>INV-2026-0842</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* ── RIGHT PANEL: PROPERTIES INSPECTOR ────────────────────────────── */}
        <aside style={{
          width: '300px',
          backgroundColor: '#131b2e',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '16px',
          gap: '16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ELEMENT PROPERTIES
          </div>

          {selectedElement ? (
            <>
              {/* Position & Size */}
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>COORDINATES & SIZE (MM)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>X (mm)</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => handleUpdateElement('x', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Y (mm)</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => handleUpdateElement('y', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Width (mm)</label>
                    <input
                      type="number"
                      value={selectedElement.w}
                      onChange={(e) => handleUpdateElement('w', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>Height (mm)</label>
                    <input
                      type="number"
                      value={selectedElement.h}
                      onChange={(e) => handleUpdateElement('h', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Title / Content */}
              {selectedElement.title !== undefined && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Title Text</label>
                  <input
                    type="text"
                    value={selectedElement.title}
                    onChange={(e) => handleUpdateElement('title', e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#ffffff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }}
                  />
                </div>
              )}

              {/* Duplicate & Delete Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => handleDuplicateElement(selectedElement)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <Copy size={14} />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#7f1d1d',
                    border: 'none',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Delete element"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>
              Select an element on the canvas to inspect and edit its mm dimensions, font styling, or data bindings.
            </div>
          )}

          {/* ── VARIABLE DICTIONARY TREE ────────────────────────────────────── */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
              DATA DICTIONARY BINDINGS
            </div>

            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '8px', top: '8px' }} />
              <input
                type="text"
                placeholder="Search variables..."
                value={variableSearch}
                onChange={(e) => setVariableSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  color: '#f8fafc',
                  padding: '6px 8px 6px 28px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {variableCategories.map((cat, idx) => (
                <div key={idx} style={{ fontSize: '11px' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, padding: '2px 0' }}>{cat.category}</div>
                  {cat.vars
                    .filter((v) => !variableSearch || v.key.toLowerCase().includes(variableSearch.toLowerCase()) || v.desc.toLowerCase().includes(variableSearch.toLowerCase()))
                    .map((v, vIdx) => (
                      <div
                        key={vIdx}
                        onClick={() => {
                          navigator.clipboard.writeText(v.key);
                          alert(`Copied ${v.key} to clipboard! Paste into element title or template.`);
                        }}
                        style={{
                          padding: '3px 6px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          backgroundColor: '#0f172a',
                          marginBottom: '2px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#cbd5e1'
                        }}
                        title={v.desc}
                      >
                        <code style={{ color: '#34d399', fontSize: '10px' }}>{v.key}</code>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>{v.desc}</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── LIVE PREVIEW MODAL ────────────────────────────────────────────── */}
      {previewModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 37, 69, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '900px',
            maxWidth: '94vw',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0b2545',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  Live Document Preview — {selectedDocCode} ({activePaper})
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, padding: '24px', backgroundColor: '#e2e8f0', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                backgroundColor: '#ffffff',
                width: activePaper === 'HALF_A4' ? '794px' : '794px',
                minHeight: activePaper === 'HALF_A4' ? '560px' : '900px',
                padding: '40px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
              }}>
                <div style={{ borderBottom: '2px solid #0b2545', paddingBottom: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0b2545' }}>LAHORE FASHION TEXTILE MILLS (PVT) LTD</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Sundar Industrial Estate, Lahore • NTN: 2849102-4 • STRN: 1700284910219</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px' }}>
                    <strong style={{ color: '#64748b', fontSize: '10px' }}>BILL TO:</strong>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545' }}>Khaadi Apparel (Pvt) Ltd</div>
                    <div>SITE Area, Karachi • NTN: 1428590-3</div>
                  </div>
                  <div style={{ fontSize: '12px', textAlign: 'right' }}>
                    <div>Ref #: <strong>INV-2026-0842</strong></div>
                    <div>Date: <strong>27-Oct-2026</strong></div>
                    <span style={{ backgroundColor: '#1e5eff', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      ORIGINAL FOR RECIPIENT
                    </span>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#0b2545', color: '#ffffff' }}>
                      <th style={{ padding: '8px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>UoM</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Rate (PKR)</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '8px' }}>Cotton Lawn 80x80/100x90 Printed Fabric (Width: 54")</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>3,000</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>Meters</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>280.00</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>840,000.00</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ maxWidth: '440px', fontSize: '11px' }}>
                    <div style={{ borderLeft: '3px solid #1e5eff', paddingLeft: '8px', marginBottom: '6px' }}>
                      <strong>Amount in Words:</strong><br />
                      Rupees Nine Hundred Ninety-One Thousand Two Hundred Only<br />
                      <span style={{ fontFamily: '"Noto Nastaliq Urdu", serif', direction: 'rtl', display: 'block', textAlign: 'right', marginTop: '2px' }}>
                        نو لاکھ اکانوے ہزار دو سو روپے فقط
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '240px', fontSize: '12px', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><strong>PKR 840,000.00</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sales Tax (18%):</span><strong>PKR 151,200.00</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0b2545', paddingTop: '4px', marginTop: '4px' }}>
                      <strong style={{ color: '#0b2545' }}>Grand Total:</strong>
                      <strong style={{ color: '#0b2545' }}>PKR 991,200.00</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ height: '36px', borderBottom: '1px solid #64748b' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Prepared By</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ height: '36px', borderBottom: '1px solid #64748b' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Checked By</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ height: '36px', borderBottom: '1px solid #64748b' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0b2545',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
