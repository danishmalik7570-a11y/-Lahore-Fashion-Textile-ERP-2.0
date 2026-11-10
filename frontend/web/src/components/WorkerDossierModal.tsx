import React, { useState } from 'react';
import type { WorkerItem } from '../context/MillDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
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
  HeartHandshake
} from 'lucide-react';

interface WorkerDossierModalProps {
  worker: WorkerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateWorker: (w: WorkerItem) => void;
  onDeleteWorker: (id: string) => void;
}

export const WorkerDossierModal: React.FC<WorkerDossierModalProps> = ({
  worker,
  isOpen,
  onClose,
  onUpdateWorker,
  onDeleteWorker,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leaves' | 'payroll' | 'advances' | 'gratuity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSeparationModalOpen, setIsSeparationModalOpen] = useState(false);

  // Edit State
  const [name, setName] = useState(worker?.name || '');
  const [department, setDepartment] = useState(worker?.department || 'Weave Shed');
  const [skillGrade, setSkillGrade] = useState(worker?.skillGrade || 'Senior (A)');
  const [shift, setShift] = useState(worker?.shift || 'Shift A (Morning)');
  const [dailyRatePKR, setDailyRatePKR] = useState(worker?.dailyRatePKR || 1850);
  const [phone, setPhone] = useState(worker?.phone || '0300-1234567');

  if (!isOpen || !worker) return null;

  // Security & Dynamic Field Masking based on current logged in user role:
  // Floor Supervisors have basic_salary hidden/confidential and CNIC partially masked.
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
  ];

  // Mock Leave Ledger
  const leaveLedger = [
    { type: 'Annual (Privilege) Leave', entitled: 14, availed: 4, balance: 10 },
    { type: 'Casual Leave', entitled: 10, availed: 2, balance: 8 },
    { type: 'Sick Leave (Medical)', entitled: 8, availed: 1, balance: 7 },
    { type: 'Festival / Statutory Holidays', entitled: 11, availed: 8, balance: 3 },
  ];

  // Mock Payroll Payslips
  const payslips = [
    { period: 'Oct 2026 (PP-2026-10)', gross: 48100, topUp: 0, otPay: 4200, eobi: 370, ss: 1480, net: 46250, status: 'Calculated' },
    { period: 'Sep 2026 (PP-2026-09)', gross: 48100, topUp: 0, otPay: 3150, eobi: 370, ss: 1480, net: 45400, status: 'Paid via Bank' },
    { period: 'Aug 2026 (PP-2026-08)', gross: 48100, topUp: 2800, otPay: 1050, eobi: 370, ss: 1480, net: 44200, status: 'Paid via Bank' },
  ];

  // Mock Advances Ledger
  const advances = [
    { id: 'ADV-104', applied: '2026-08-15', amount: 15000, monthlyInstalment: 5000, recovered: 10000, outstanding: 5000, status: 'Recovering' },
  ];

  // Gratuity calculation parameters (Standing Orders Ordinance)
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
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        style={{ maxWidth: '1080px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0d2242 0%, #1e3a8a 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}>
                {worker.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
                  {worker.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#93c5fd', fontWeight: 700 }}>
                    {worker.employeeCode}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    {worker.status}
                  </span>
                  {isSupervisor && (
                    <span className="badge badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      <Lock size={10} /> Role Scoped: Supervisor View
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p style={{ color: '#bfdbfe', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Mill 360° Worker Dossier • {worker.department} • {worker.shift}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <Edit3 size={15} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={() => setIsSeparationModalOpen(true)}
              className="btn btn-secondary"
              style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', borderColor: 'rgba(220, 38, 38, 0.3)', fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <Trash2 size={15} />
              <span>Separate / Exit</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 28px',
          gap: '4px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'profile', label: '360° Bio & Org', icon: Award },
            { id: 'attendance', label: 'Biometric Punches & OT', icon: Clock },
            { id: 'leaves', label: 'Leave Ledger', icon: Calendar },
            { id: 'payroll', label: 'Payroll & Payslips', icon: DollarSign },
            { id: 'advances', label: 'Advances & Loans', icon: Layers },
            { id: 'gratuity', label: 'Gratuity & Exit Settlement', icon: HeartHandshake },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--blue-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid var(--blue-primary)' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '24px 28px', maxHeight: '540px', overflowY: 'auto' }}>
          
          {/* TAB 1: 360° Profile & Placement */}
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <div>
                      <label className="label">Daily Wage Rate (PKR) *</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={dailyRatePKR} 
                        onChange={(e) => setDailyRatePKR(Number(e.target.value))} 
                        min="1400"
                        required 
                      />
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NADRA CNIC</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                        {displayCNIC}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', marginTop: '2px' }}>
                        ● Verified Biometric Record
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COMPENSATION RATE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
                        {displaySalary}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {isSupervisor ? 'Hidden by RBAC Field Policy' : 'Sindh/Punjab Minimum Wage Compliant'}
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONTACT PHONE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                        {worker.phone}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        WhatsApp Payslip Enabled
                      </div>
                    </div>
                  </div>

                  {/* Organization & Location Dossier */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} color="var(--blue-primary)" />
                      <span>Factory Deployment & Floor Assignment</span>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Mill Branch</span>
                        <strong>Lahore Unit 1 (Weaving)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Section</span>
                        <strong>Air-Jet Looms Section #2</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Assigned Line</span>
                        <strong>Line L-04 (Picanol OmniPlus)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Reporting Supervisor</span>
                        <strong>Tariq Mehmood (Sup-01)</strong>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                    Turnstile Biometric Gate Punch Log
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Synced live from ZKTeco Facial/Fingerprint Terminal
                  </span>
                </div>
                <span className="badge badge-emerald">
                  Weekly OT Cap: 4.5 / 12 hrs (Factories Act Compliant)
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '10px 12px' }}>DATE</th>
                    <th style={{ padding: '10px 12px' }}>SHIFT</th>
                    <th style={{ padding: '10px 12px' }}>IN TIME</th>
                    <th style={{ padding: '10px 12px' }}>OUT TIME</th>
                    <th style={{ padding: '10px 12px' }}>LATE (MINS)</th>
                    <th style={{ padding: '10px 12px' }}>OVERTIME</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {punchLogs.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.date}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>{p.shift}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.in}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{p.out}</td>
                      <td style={{ padding: '10px 12px', color: p.late > 0 ? 'var(--rose)' : 'var(--text-sub)' }}>
                        {p.late > 0 ? `+${p.late}m` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: p.otHours > 0 ? 'var(--blue-primary)' : 'var(--text-sub)' }}>
                        {p.otHours > 0 ? `${p.otHours} hrs` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={p.status === 'On Time' ? 'badge badge-emerald' : 'badge badge-gold'} style={{ fontSize: '0.7rem' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Leave Ledger */}
          {activeTab === 'leaves' && (
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '14px' }}>
                Statutory Leave Balance Ledger (CY 2026)
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '10px 12px' }}>LEAVE CATEGORY</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>STATUTORY ENTITLEMENT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>AVAILED TO DATE</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>REMAINING BALANCE</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>ENCASHABLE ON EXIT</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveLedger.map((l, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{l.type}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{l.entitled} days</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--rose)', fontWeight: 600 }}>{l.availed} days</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: 'var(--emerald)' }}>{l.balance} days</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {l.type.includes('Annual') ? '✅ Yes (100% Wage)' : '❌ Forfeited'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Payroll & Payslips History */}
          {activeTab === 'payroll' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                  Payslip & Earnings Statement Ledger
                </h3>
                <span className="badge badge-blue">
                  Bank Advice Auto-Generated
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '10px 12px' }}>PERIOD</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>GROSS EARNINGS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>OT PAY</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>EOBI (1%)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>SS (PESSI)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>NET DISBURSED</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>WHATSAPP</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((ps, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--blue-primary)' }}>{ps.period}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        {isSupervisor ? '••••••' : `PKR ${ps.gross.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--emerald)', fontWeight: 600 }}>
                        {isSupervisor ? '••••' : `+${ps.otPay.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--rose)' }}>
                        {isSupervisor ? '•••' : `-${ps.eobi}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--rose)' }}>
                        {isSupervisor ? '••••' : `-${ps.ss}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
                        {isSupervisor ? '•••••• [Masked]' : `PKR ${ps.net.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: Advances & Loan Ledger */}
          {activeTab === 'advances' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                  Salary Advances & Loan Recoveries
                </h3>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '10px 12px' }}>ADVANCE ID</th>
                    <th style={{ padding: '10px 12px' }}>DATE APPLIED</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>AMOUNT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>MONTHLY DEDUCTION</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>RECOVERED</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>OUTSTANDING</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((adv) => (
                    <tr key={adv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>{adv.id}</td>
                      <td style={{ padding: '12px' }}>{adv.applied}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>PKR {adv.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>PKR {adv.monthlyInstalment.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--emerald)', fontWeight: 600 }}>PKR {adv.recovered.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--rose)' }}>PKR {adv.outstanding.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>{adv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: Gratuity & Final Settlement Calculator */}
          {activeTab === 'gratuity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--blue-light)', border: '1px solid #bfdbfe', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--blue-dark)', margin: 0, fontWeight: 700 }}>
                  Pakistan Standing Orders Ordinance 1968 — Statutory Exit Gratuity
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
                  Rule: 30 days basic wages for every completed year of service (or part in excess of 6 months).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <div className="glass-panel" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SERVICE LENGTH</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{completedYears} Years</div>
                </div>
                <div className="glass-panel" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STATUTORY GRATUITY</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '2px' }}>
                    PKR {gratuityAmount.toLocaleString()}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>UNAVAILED LEAVES</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '2px' }}>
                    +PKR {leaveEncashmentAmount.toLocaleString()}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LOAN RECOVERY DEDUCTION</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rose)', marginTop: '2px' }}>
                    -PKR {outstandingLoans.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>NET EXIT SETTLEMENT PAYABLE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                    PKR {netSettlement.toLocaleString()}
                  </div>
                </div>

                <button 
                  onClick={() => setIsSeparationModalOpen(true)}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
                >
                  Generate Clearance Certificate
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Nested Separation / Exit Modal */}
        {isSeparationModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsSeparationModalOpen(false)}>
            <div 
              className="modal-content animate-fade-in" 
              style={{ maxWidth: '520px', padding: '24px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--rose)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>Confirm Worker Separation & Exit</span>
                </h3>
                <button onClick={() => setIsSeparationModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.5', marginBottom: '16px' }}>
                You are about to initiate final separation for <strong>{worker.name}</strong> ({worker.employeeCode}). This will calculate final dues of <strong>PKR {netSettlement.toLocaleString()}</strong>, mark the biometric turnstile profile as inactive, and generate final accounts voucher.
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
    </div>
  );
};
