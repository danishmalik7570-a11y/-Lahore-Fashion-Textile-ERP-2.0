import React, { useState } from 'react';
import type { WorkerItem } from '../context/MillDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  DollarSign, 
  Award, 
  Building2, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Lock,
  Layers,
  HeartHandshake,
  Printer,
  Fingerprint,
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export interface WorkerProfileViewProps {
  worker: WorkerItem;
  onBack: () => void;
  onUpdateWorker: (w: WorkerItem) => void;
  onDeleteWorker: (id: string) => void;
}

export const WorkerProfileView: React.FC<WorkerProfileViewProps> = ({
  worker,
  onBack,
  onUpdateWorker,
  onDeleteWorker,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leaves' | 'payroll' | 'advances' | 'gratuity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSeparationModalOpen, setIsSeparationModalOpen] = useState(false);

  // Edit State
  const [name, setName] = useState(worker.name);
  const [department, setDepartment] = useState(worker.department);
  const [skillGrade, setSkillGrade] = useState(worker.skillGrade);
  const [shift, setShift] = useState(worker.shift);
  const [dailyRatePKR, setDailyRatePKR] = useState(worker.dailyRatePKR);
  const [phone, setPhone] = useState(worker.phone || '0300-1234567');

  // Security & Dynamic Field Masking for Supervisors
  const isSupervisor = user?.role === 'supervisor';
  const displaySalary = isSupervisor 
    ? '•••••• [Confidential]' 
    : `PKR ${worker.dailyRatePKR.toLocaleString()} / day (PKR ${(worker.dailyRatePKR * 26).toLocaleString()} / mo)`;
  
  const displayCNIC = isSupervisor 
    ? `${worker.cnic.slice(0, 5)}-*****${worker.cnic.slice(-2)}` 
    : worker.cnic;

  // Mock Attendance Punch History
  const punchLogs = [
    { date: '2026-10-23', shift: worker.shift, in: '06:54 AM', out: '03:05 PM', late: 0, otHours: 1.5, status: 'On Time' },
    { date: '2026-10-22', shift: worker.shift, in: '07:12 AM', out: '03:00 PM', late: 12, otHours: 0, status: 'Late Mark' },
    { date: '2026-10-21', shift: worker.shift, in: '06:58 AM', out: '04:00 PM', late: 0, otHours: 2.0, status: 'On Time' },
    { date: '2026-10-20', shift: worker.shift, in: '06:55 AM', out: '03:00 PM', late: 0, otHours: 0, status: 'On Time' },
    { date: '2026-10-19', shift: worker.shift, in: '07:00 AM', out: '03:10 PM', late: 0, otHours: 0, status: 'On Time' },
    { date: '2026-10-18', shift: worker.shift, in: '06:52 AM', out: '03:00 PM', late: 0, otHours: 1.0, status: 'On Time' },
    { date: '2026-10-17', shift: worker.shift, in: '07:02 AM', out: '03:00 PM', late: 2, otHours: 0, status: 'On Time' },
  ];

  // Mock Leave Ledger
  const leaveLedger = [
    { type: 'Annual (Privilege) Leave', entitled: 14, availed: 4, balance: 10, encashable: true },
    { type: 'Casual Leave', entitled: 10, availed: 2, balance: 8, encashable: false },
    { type: 'Sick Leave (Medical)', entitled: 8, availed: 1, balance: 7, encashable: false },
    { type: 'Festival / Statutory Holidays', entitled: 11, availed: 8, balance: 3, encashable: false },
  ];

  // Mock Payroll Payslips
  const payslips = [
    { period: 'Oct 2026 (PP-2026-10)', gross: 48100, topUp: 0, otPay: 4200, eobi: 370, ss: 1480, net: 46250, status: 'Calculated' },
    { period: 'Sep 2026 (PP-2026-09)', gross: 48100, topUp: 0, otPay: 3150, eobi: 370, ss: 1480, net: 45400, status: 'Paid via Bank' },
    { period: 'Aug 2026 (PP-2026-08)', gross: 48100, topUp: 2800, otPay: 1050, eobi: 370, ss: 1480, net: 44200, status: 'Paid via Bank' },
    { period: 'Jul 2026 (PP-2026-07)', gross: 48100, topUp: 0, otPay: 2100, eobi: 370, ss: 1480, net: 44350, status: 'Paid via Bank' },
  ];

  // Mock Advances Ledger
  const advances = [
    { id: 'ADV-104', applied: '2026-08-15', amount: 15000, monthlyInstalment: 5000, recovered: 10000, outstanding: 5000, status: 'Recovering' },
    { id: 'ADV-088', applied: '2026-02-10', amount: 20000, monthlyInstalment: 5000, recovered: 20000, outstanding: 0, status: 'Completed' },
  ];

  // Gratuity calculation parameters (Standing Orders Ordinance 1968)
  const completedYears = 3.5;
  const monthlyBasic = worker.dailyRatePKR * 26;
  const gratuityAmount = Math.round(monthlyBasic * completedYears);
  const leaveEncashmentAmount = Math.round(10 * worker.dailyRatePKR);
  const outstandingLoans = 5000;
  const netSettlement = gratuityAmount + leaveEncashmentAmount - outstandingLoans;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorker({
      ...worker,
      name,
      department: department as any,
      skillGrade: skillGrade as any,
      shift: shift as any,
      dailyRatePKR: Number(dailyRatePKR),
      phone,
    });
    setIsEditing(false);
  };

  const handleSeparateWorker = () => {
    if (confirm(`Confirm final separation & settlement for ${worker.name}? This will archive worker profile and generate Gratuity voucher.`)) {
      onDeleteWorker(worker.id);
      setIsSeparationModalOpen(false);
      onBack();
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Breadcrumb & Back Action Bar */}
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
            <span>Back to Workers Roster</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>/</span>
            <span>Workforce Management</span>
            <span>/</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {worker.name} ({worker.employeeCode})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            Turnstile Biometric Synchronized
          </span>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 12px' }}
          >
            <Printer size={15} />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Hero Executive Profile Banner */}
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
          {/* Avatar Tile */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ffffff',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.8rem',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
          }}>
            {worker.name.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {worker.name}
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                {worker.employeeCode}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                {worker.status}
              </span>
              {isSupervisor && (
                <span className="badge badge-gold" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  <Lock size={11} /> Role Scoped: Supervisor View
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', color: '#bfdbfe', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={15} color="#93c5fd" />
                {worker.department}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Award size={15} color="#93c5fd" />
                Grade: {worker.skillGrade}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={15} color="#93c5fd" />
                {worker.shift}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={14} color="#93c5fd" />
                {worker.phone || '0300-1234567'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary"
            style={{
              background: '#ffffff',
              color: '#1d4ed8',
              borderColor: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '9px 16px',
            }}
          >
            <Edit3 size={16} />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Worker Details'}</span>
          </button>
          
          <button
            onClick={() => setIsSeparationModalOpen(true)}
            className="btn btn-secondary"
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '9px 16px',
            }}
          >
            <Trash2 size={16} />
            <span>Separate / Exit Worker</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NADRA CNIC RECORD</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--text-main)' }}>
            {displayCNIC}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Fingerprint size={13} /> Verified Biometric ID
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPENSATION RATE</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
            {displaySalary}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            {isSupervisor ? 'Confidential by RBAC Policy' : 'Sindh/Punjab Minimum Wage Top-Up Ready'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUNCTUALITY & ATTENDANCE</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '4px' }}>
            98.4% On-Time
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Weekly OT: 4.5 / 12 hrs (Factories Act)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTSTANDING ADVANCES</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--rose)', marginTop: '4px' }}>
            PKR {advances[0]?.outstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Monthly Recovery: PKR {advances[0]?.monthlyInstalment.toLocaleString()}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACCRUED GRATUITY (EST.)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            PKR {gratuityAmount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {completedYears} Years Service (Standing Orders)
          </div>
        </div>
      </div>

      {/* Main Tabbed Enterprise Container */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 24px',
          gap: '8px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'profile', label: '360° Bio & Org Hierarchy', icon: Award },
            { id: 'attendance', label: 'Biometric Punches & Overtime Cap', icon: Clock },
            { id: 'leaves', label: 'Statutory Leave Ledger', icon: Calendar },
            { id: 'payroll', label: 'Payroll & Payslips Ledger', icon: DollarSign },
            { id: 'advances', label: 'Advances & Loan Recovery', icon: Layers },
            { id: 'gratuity', label: 'Gratuity & Exit Settlement', icon: HeartHandshake },
          ].map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 18px',
                  fontSize: '0.875rem',
                  fontWeight: isTabActive ? 800 : 600,
                  border: 'none',
                  background: 'transparent',
                  color: isTabActive ? 'var(--blue-primary)' : 'var(--text-muted)',
                  borderBottom: isTabActive ? '3px solid var(--blue-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={17} color={isTabActive ? 'var(--blue-primary)' : 'var(--text-sub)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div style={{ padding: '30px' }}>
          
          {/* TAB 1: 360° Bio & Org Hierarchy */}
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
                  <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                      Edit Worker Master Information
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Update contact numbers, skill matrix grading, shift assignment, and wage schedule
                    </p>
                  </div>

                  <div className="form-grid-2">
                    <div>
                      <label className="label">Worker Full Name *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="label">Contact Mobile *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div>
                      <label className="label">Department *</label>
                      <select 
                        className="input-field" 
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value as any)}
                      >
                        <option value="Weave Shed">Weave Shed</option>
                        <option value="Spinning Floor">Spinning Floor</option>
                        <option value="Dyeing & Bleaching">Dyeing & Bleaching</option>
                        <option value="Cutting & Stitching">Cutting & Stitching</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Skill Grade *</label>
                      <select 
                        className="input-field" 
                        value={skillGrade} 
                        onChange={(e) => setSkillGrade(e.target.value as any)}
                      >
                        <option value="Master Craft (M)">Master Craft (M)</option>
                        <option value="Senior (A)">Senior (A)</option>
                        <option value="Skilled (B)">Skilled (B)</option>
                        <option value="Apprentice (C)">Apprentice (C)</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Assigned Shift *</label>
                      <select 
                        className="input-field" 
                        value={shift} 
                        onChange={(e) => setShift(e.target.value as any)}
                      >
                        <option value="Shift A (Morning)">Shift A (07:00 - 15:00)</option>
                        <option value="Shift B (Evening)">Shift B (15:00 - 23:00)</option>
                        <option value="Shift C (Night)">Shift C (23:00 - 07:00)</option>
                        <option value="General Shift">General Shift (09:00 - 18:00)</option>
                      </select>
                    </div>
                  </div>

                  {!isSupervisor && (
                    <div style={{ maxWidth: '400px' }}>
                      <label className="label">Daily Wage Rate (PKR) *</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={dailyRatePKR} 
                        onChange={(e) => setDailyRatePKR(Number(e.target.value))} 
                        min="1400"
                        required 
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        Monthly Gross: PKR {(dailyRatePKR * 26).toLocaleString()} (Standard 26 working days)
                      </span>
                    </div>
                  )}

                  <div className="form-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Detailed Organization & Line Placement */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} color="var(--blue-primary)" />
                      <span>Factory Deployment & Floor Assignment</span>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Operating Mill Branch</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Lahore Unit 1 (Weaving Complex)</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Raiwind Industrial Area, Lahore</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Factory Section & Floor</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Air-Jet Looms Section #2</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Shed B • High Speed Weaving</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Assigned Production Line</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Line L-04 (Picanol OmniPlus)</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Fabric Spec: 100% Combed Cotton 40s</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Reporting Floor Supervisor</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Tariq Mehmood (SUP-01)</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Scope: Line L-01 to L-08</div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory & Banking Registration */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} color="var(--emerald)" />
                      <span>Statutory Registration & Payment Routing</span>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>EOBI Registration No.</span>
                        <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>EOBI-LHE-9821447</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '4px' }}>● 1% Employee / 5% Employer Active</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Social Security (PESSI/SESSI)</span>
                        <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>PESSI-REG-551029</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '4px' }}>● 6% Employer Health Card Issued</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Bank Disbursement Account</span>
                        <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>PK89HABB00012938471</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Habib Bank Ltd • Industrial Branch</div>
                      </div>

                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Employment Classification</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--blue-primary)' }}>Permanent Industrial Worker</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Standing Orders Ordinance 1968</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: Attendance & Punches Ledger */}
          {activeTab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                    Turnstile Biometric Gate Punch Log & Overtime Tracking
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Continuous live stream from ZKTeco Facial/Fingerprint Turnstiles (Gate 01 & Gate 02)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    Weekly OT Cap: 4.5 / 12 hrs (Factories Act Compliant)
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '12px 14px' }}>DATE</th>
                      <th style={{ padding: '12px 14px' }}>SHIFT</th>
                      <th style={{ padding: '12px 14px' }}>IN TIME</th>
                      <th style={{ padding: '12px 14px' }}>OUT TIME</th>
                      <th style={{ padding: '12px 14px' }}>LATE MARKS</th>
                      <th style={{ padding: '12px 14px' }}>OVERTIME</th>
                      <th style={{ padding: '12px 14px' }}>GATE TERMINAL</th>
                      <th style={{ padding: '12px 14px' }}>PUNCH VERIFICATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {punchLogs.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{p.date}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>{p.shift}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.in}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{p.out}</td>
                        <td style={{ padding: '12px 14px', color: p.late > 0 ? 'var(--rose)' : 'var(--text-sub)', fontWeight: p.late > 0 ? 700 : 500 }}>
                          {p.late > 0 ? `+${p.late} mins` : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: p.otHours > 0 ? 'var(--blue-primary)' : 'var(--text-sub)' }}>
                          {p.otHours > 0 ? `${p.otHours} hrs` : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Turnstile Turn-01
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={p.status === 'On Time' ? 'badge badge-emerald' : 'badge badge-gold'} style={{ fontSize: '0.72rem' }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Statutory Leave Ledger */}
          {activeTab === 'leaves' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                    Statutory Leave Balance Ledger (Calendar Year 2026)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Administered under Punjab Factories Rules & Standing Orders Ordinance 1968
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '12px 14px' }}>LEAVE CATEGORY</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>STATUTORY ENTITLEMENT</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>AVAILED TO DATE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>REMAINING BALANCE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>EXIT ENCASHMENT RULE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveLedger.map((l, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{l.type}</td>
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>{l.entitled} days</td>
                        <td style={{ padding: '14px', textAlign: 'center', color: 'var(--rose)', fontWeight: 700 }}>{l.availed} days</td>
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800, color: 'var(--emerald)', fontSize: '1rem' }}>{l.balance} days</td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className={l.encashable ? 'badge badge-emerald' : 'badge badge-subtle'} style={{ fontSize: '0.75rem' }}>
                            {l.encashable ? 'Encashable at 100% Basic' : 'Non-Encashable (Lapsed)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Payroll & Payslips Ledger */}
          {activeTab === 'payroll' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                    Monthly Payslips & Historical Wage Disbursal Ledger
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Includes Sindh/Punjab minimum wage top-up, 2x OT rate, EOBI (1%), and Social Security (PESSI)
                  </span>
                </div>
                <span className="badge badge-blue" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  Bank Advice Auto-Generated
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '12px 14px' }}>PAYROLL PERIOD</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>GROSS BASIC</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>OVERTIME PAY</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>EOBI (1%)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>PESSI / SS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>NET DISBURSED</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>DISBURSAL STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((ps, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
                          {ps.period}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 600 }}>
                          {isSupervisor ? '••••••' : `PKR ${ps.gross.toLocaleString()}`}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--emerald)', fontWeight: 700 }}>
                          {isSupervisor ? '••••' : `+PKR ${ps.otPay.toLocaleString()}`}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--rose)' }}>
                          {isSupervisor ? '•••' : `-PKR ${ps.eobi}`}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--rose)' }}>
                          {isSupervisor ? '••••' : `-PKR ${ps.ss}`}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                          {isSupervisor ? '•••••• [Confidential]' : `PKR ${ps.net.toLocaleString()}`}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className={ps.status.includes('Paid') ? 'badge badge-emerald' : 'badge badge-blue'} style={{ fontSize: '0.75rem' }}>
                            {ps.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Advances & Loan Recovery */}
          {activeTab === 'advances' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                    Worker Salary Advances & Loan Recovery Schedule
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Automated payroll deductions under Standing Orders maximum 1/3rd monthly wage deduction rule
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '12px 14px' }}>ADVANCE ID</th>
                      <th style={{ padding: '12px 14px' }}>DISBURSAL DATE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>LOAN PRINCIPAL</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>MONTHLY INSTALMENT</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL RECOVERED</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>BALANCE OUTSTANDING</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>LOAN STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((adv) => (
                      <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--blue-primary)' }}>
                          {adv.id}
                        </td>
                        <td style={{ padding: '14px' }}>{adv.applied}</td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700 }}>PKR {adv.amount.toLocaleString()}</td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>PKR {adv.monthlyInstalment.toLocaleString()}</td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--emerald)', fontWeight: 700 }}>
                          PKR {adv.recovered.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: adv.outstanding > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
                          PKR {adv.outstanding.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className={adv.status === 'Completed' ? 'badge badge-emerald' : 'badge badge-gold'} style={{ fontSize: '0.75rem' }}>
                            {adv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Gratuity & Final Settlement */}
          {activeTab === 'gratuity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ background: 'var(--blue-light)', border: '1px solid #bfdbfe', padding: '18px 22px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--blue-dark)', margin: 0, fontWeight: 800 }}>
                  Pakistan Standing Orders Ordinance 1968 — Statutory Exit Gratuity Calculator
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                  Statutory Rule: 30 days basic wages calculated on the last drawn rate for every completed year of continuous service or period exceeding 6 months. Unavailed annual leaves are encashed at 100% daily basic wage.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '18px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTINUOUS SERVICE</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '4px' }}>{completedYears} Years</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Joined: April 2023</div>
                </div>

                <div className="glass-panel" style={{ padding: '18px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUTORY GRATUITY (30D)</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--emerald)', marginTop: '4px' }}>
                    PKR {gratuityAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '4px' }}>3.5 × PKR {monthlyBasic.toLocaleString()}</div>
                </div>

                <div className="glass-panel" style={{ padding: '18px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ANNUAL LEAVE ENCASHMENT</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--blue-primary)', marginTop: '4px' }}>
                    +PKR {leaveEncashmentAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>10 Days × PKR {worker.dailyRatePKR}</div>
                </div>

                <div className="glass-panel" style={{ padding: '18px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOAN RECOVERY DEDUCTION</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--rose)', marginTop: '4px' }}>
                    -PKR {outstandingLoans.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginTop: '4px' }}>Cleared from Final Settlement</div>
                </div>
              </div>

              {/* Settlement Payable Ribbon */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                padding: '24px 28px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 700 }}>
                    NET FINAL EXIT SETTLEMENT PAYABLE
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    PKR {netSettlement.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                    Includes statutory gratuity + leave encashment - advance deductions
                  </div>
                </div>

                <button 
                  onClick={() => setIsSeparationModalOpen(true)}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  Generate Exit Clearance Certificate
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Separation & Exit Confirmation Dialog */}
      {isSeparationModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsSeparationModalOpen(false)}>
          <div 
            className="modal-content animate-fade-in" 
            style={{ maxWidth: '560px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--rose)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                <span>Confirm Worker Separation & Exit</span>
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
              You are about to initiate final separation for <strong>{worker.name}</strong> ({worker.employeeCode}). This will calculate final statutory dues of <strong>PKR {netSettlement.toLocaleString()}</strong>, deactivate biometric turnstile credentials, and generate finance disbursement vouchers.
            </p>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setIsSeparationModalOpen(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSeparateWorker} 
                className="btn btn-primary"
                style={{ background: 'var(--rose)', borderColor: 'var(--rose)' }}
              >
                Confirm & Archive Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
