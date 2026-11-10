import React, { useState, useEffect } from 'react';
import { useMillData, type WorkerItem } from '../context/MillDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Clock, 
  Award, 
  Fingerprint, 
  X,
  CheckCircle2,
  FileText,
  Lock,
  CreditCard,
  Shield,
  FileSpreadsheet,
  Download,
  Printer
} from 'lucide-react';
import { WorkerProfileView } from './WorkerProfileView';

export interface LabourViewProps {
  initialTab?: 'workers' | 'attendance' | 'payroll' | 'compliance';
}

export const LabourView: React.FC<LabourViewProps> = ({ initialTab = 'workers' }) => {
  const { user } = useAuth();
  const { workers, addWorker, updateWorker, deleteWorker, attendance, recordClockIn } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'workers' | 'attendance' | 'payroll' | 'compliance'>(initialTab);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [selectedWorkerForDossier, setSelectedWorkerForDossier] = useState<WorkerItem | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const isSupervisor = user?.role === 'supervisor';

  // Worker Form State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<WorkerItem['department']>('Weave Shed');
  const [skillGrade, setSkillGrade] = useState<WorkerItem['skillGrade']>('Senior (A)');
  const [shift, setShift] = useState<WorkerItem['shift']>('Shift A (Morning)');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [dailyRatePKR, setDailyRatePKR] = useState<number>(1850);

  // Punch Form State
  const [punchEmployeeCode, setPunchEmployeeCode] = useState(workers[0]?.employeeCode || 'EMP-LF-104');

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cnic) {
      alert('Please fill required worker details.');
      return;
    }

    addWorker({
      name,
      department,
      skillGrade,
      shift,
      cnic,
      phone,
      dailyRatePKR: Number(dailyRatePKR),
      status: 'Active'
    });

    setName('');
    setCnic('');
    setPhone('');
    setIsWorkerModalOpen(false);
  };

  const handlePunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = workers.find(w => w.employeeCode === punchEmployeeCode);
    if (!targetWorker) return;

    recordClockIn(
      targetWorker.employeeCode,
      targetWorker.name,
      targetWorker.department,
      targetWorker.shift
    );

    setIsPunchModalOpen(false);
  };

  if (selectedWorkerForDossier) {
    return (
      <WorkerProfileView
        worker={selectedWorkerForDossier}
        onBack={() => setSelectedWorkerForDossier(null)}
        onUpdateWorker={(updated) => {
          updateWorker(updated);
          setSelectedWorkerForDossier(updated);
        }}
        onDeleteWorker={(id) => {
          deleteWorker(id);
          setSelectedWorkerForDossier(null);
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <UserCheck size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Labour Management & Biometric Attendance
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Enrolled mill operators, skill matrix grades, daily wage rate, and biometric gate turnstile punches
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsPunchModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Fingerprint size={18} color="var(--blue-primary)" />
            <span>Biometric Clock-In</span>
          </button>

          <button 
            onClick={() => setIsWorkerModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            <span>Enroll New Mill Worker</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENROLLED WORKFORCE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {workers.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Workers</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● Biometrically registered with NADRA CNIC
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUNCHED IN TODAY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            {attendance.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Floor</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Shift A & Shift B turnstile sync
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE DAILY WAGE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            PKR 1,850
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Piece-rate incentive available
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUNCTUALITY RATE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            96.2%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            On-time morning gate arrival
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('workers')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'workers' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'workers' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <UserCheck size={16} />
          <span>Workers Master Roster ({workers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'attendance' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'attendance' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={16} />
          <span>Live Biometric Punch Log ({attendance.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'payroll' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'payroll' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <CreditCard size={16} />
          <span>Payroll & Bank Files</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'compliance' ? '3px solid var(--blue-primary)' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'compliance' ? 'var(--blue-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Shield size={16} />
          <span>Statutory Compliance (EOBI & PESSI)</span>
        </button>
      </div>

      {/* Workers Roster Tab */}
      {activeTab === 'workers' && (
        <>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px', position: 'relative' }}>
              <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search workers by name, employee code, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>EMPLOYEE CODE</th>
                  <th style={{ padding: '12px 14px' }}>WORKER NAME</th>
                  <th style={{ padding: '12px 14px' }}>DEPARTMENT</th>
                  <th style={{ padding: '12px 14px' }}>SKILL GRADE</th>
                  <th style={{ padding: '12px 14px' }}>ASSIGNED SHIFT</th>
                  <th style={{ padding: '12px 14px' }}>DAILY WAGE</th>
                  <th style={{ padding: '12px 14px' }}>CNIC NUMBER</th>
                  <th style={{ padding: '12px 14px' }}>STATUS</th>
                  <th style={{ padding: '12px 14px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((w) => (
                  <tr 
                    key={w.id}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedWorkerForDossier(w)}
                  >
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                      {w.employeeCode}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {w.name}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className="badge badge-blue">{w.department}</span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Award size={14} color="var(--emerald)" />
                        <span>{w.skillGrade}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {w.shift}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {isSupervisor ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} /> Confidential
                        </span>
                      ) : (
                        `PKR ${w.dailyRatePKR.toLocaleString()} / day`
                      )}
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isSupervisor ? `${w.cnic.slice(0, 5)}-*****${w.cnic.slice(-2)}` : w.cnic}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className="badge badge-emerald">{w.status}</span>
                    </td>
                    <td style={{ padding: '14px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedWorkerForDossier(w)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <FileText size={13} color="var(--blue-primary)" />
                        <span>360° Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px' }}>EMPLOYEE</th>
                <th style={{ padding: '12px 14px' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 14px' }}>SHIFT</th>
                <th style={{ padding: '12px 14px' }}>CLOCK-IN TIME</th>
                <th style={{ padding: '12px 14px' }}>BIOMETRIC GATE</th>
                <th style={{ padding: '12px 14px' }}>PUNCH STATUS</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((att) => (
                <tr 
                  key={att.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{att.name}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>{att.employeeCode}</div>
                  </td>
                  <td style={{ padding: '14px' }}>{att.department}</td>
                  <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{att.shift}</td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--blue-primary)" />
                      <span>{att.clockIn}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {att.biometricGate}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className={att.status === 'On Time' ? 'badge badge-emerald' : 'badge badge-gold'}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Payroll & Bank Files */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                Monthly Payroll & Bank Disbursal Run (October 2026)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Automated wage calculation factoring 26 working days, piece-rate incentives, 2x OT, and statutory deductions
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => alert('Exporting Master Payroll Excel Sheet for Habib Bank Corporate...')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
              >
                <FileSpreadsheet size={15} color="var(--emerald)" />
                <span>Export Bank Advice</span>
              </button>
              <button
                onClick={() => alert('Printing Monthly Payslips Batch...')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
              >
                <Printer size={15} />
                <span>Print All Slips</span>
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>WORKER</th>
                  <th style={{ padding: '12px 14px' }}>DEPARTMENT & SHIFT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>DAILY RATE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>DAYS WORKED</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>BASIC GROSS</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>PIECE-RATE INCENTIVE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>EOBI (1%)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>NET DISBURSEMENT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, idx) => {
                  const days = 26;
                  const basicGross = w.dailyRatePKR * days;
                  const incentive = idx % 2 === 0 ? 3450 : 2100;
                  const eobi = Math.round(basicGross * 0.01);
                  const net = basicGross + incentive - eobi;

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{w.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{w.employeeCode}</div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div>{w.department}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{w.shift}</div>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>PKR {w.dailyRatePKR.toLocaleString()}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 600 }}>{days} d</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 600 }}>PKR {basicGross.toLocaleString()}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: 'var(--emerald)', fontWeight: 700 }}>+PKR {incentive.toLocaleString()}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: 'var(--rose)' }}>-PKR {eobi}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: 'var(--blue-primary)', fontSize: '0.95rem' }}>
                        PKR {net.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                          HBL Cleared
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Statutory Compliance (EOBI & PESSI) */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>EOBI REGISTRATION STATUS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
                100% Verified
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                All {workers.length} workers enrolled with unique EOBI Registration Cards
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PESSI SOCIAL SECURITY</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
                Paid in Full
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '6px' }}>
                Punjab Employees Social Security Challan verified with 0 penalties
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FACTORIES ACT COMPLIANCE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                Grade A Mill
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                Labour Dept statutory register Forms B, C, D maintained
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                Statutory Register: Verified CNIC & EOBI Ledger
              </h3>
              <button
                onClick={() => alert('Downloading Punjab Labour Dept Form 5A & 5B Challan...')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span>Download EOBI Challan 5A</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>WORKER NAME</th>
                  <th style={{ padding: '12px 14px' }}>CNIC (NADRA VERIFIED)</th>
                  <th style={{ padding: '12px 14px' }}>EOBI REGISTRATION NO</th>
                  <th style={{ padding: '12px 14px' }}>PESSI SS CARD</th>
                  <th style={{ padding: '12px 14px' }}>WORKER (1%)</th>
                  <th style={{ padding: '12px 14px' }}>EMPLOYER (5%)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>COMPLIANCE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, idx) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{w.name}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>{w.cnic}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)' }}>
                      EOBI-{3520100 + idx}
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)' }}>
                      PESSI-LHR-{9800 + idx}
                    </td>
                    <td style={{ padding: '14px' }}>PKR 340</td>
                    <td style={{ padding: '14px' }}>PKR 1,700</td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        ✓ Active & Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workable Modal: Enroll New Worker */}
      {isWorkerModalOpen && (
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
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Enroll New Mill Worker
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Register employee details, skill grade, shift roster, and wage rate
                </p>
              </div>
              <button 
                onClick={() => setIsWorkerModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWorkerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Full Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Muhammad Aslam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Mill Department *</label>
                  <select 
                    className="input-field"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as WorkerItem['department'])}
                  >
                    <option value="Weave Shed">Weave Shed</option>
                    <option value="Dye House">Dye House</option>
                    <option value="Rotary Printing">Rotary Printing</option>
                    <option value="Stitching Line">Stitching Line</option>
                    <option value="QC Inspection">QC Inspection</option>
                    <option value="Warehouse">Warehouse</option>
                  </select>
                </div>

                <div>
                  <label className="label">Skill Grade *</label>
                  <select 
                    className="input-field"
                    value={skillGrade}
                    onChange={(e) => setSkillGrade(e.target.value as WorkerItem['skillGrade'])}
                  >
                    <option value="Master (A+)">Master (A+)</option>
                    <option value="Senior (A)">Senior (A)</option>
                    <option value="Operator (B)">Operator (B)</option>
                    <option value="Helper (C)">Helper (C)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Assigned Shift *</label>
                  <select 
                    className="input-field"
                    value={shift}
                    onChange={(e) => setShift(e.target.value as WorkerItem['shift'])}
                  >
                    <option value="Shift A (Morning)">Shift A (Morning 06:00 - 14:00)</option>
                    <option value="Shift B (Evening)">Shift B (Evening 14:00 - 22:00)</option>
                    <option value="Shift C (Night)">Shift C (Night 22:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Daily Wage Rate (PKR) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1000"
                    step="50"
                    value={dailyRatePKR}
                    onChange={(e) => setDailyRatePKR(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">NADRA CNIC Number *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 35202-1234567-1"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Contact Mobile Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsWorkerModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Enroll Worker into System</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workable Modal: Biometric Clock-In */}
      {isPunchModalOpen && (
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
            maxWidth: '500px',
            padding: '28px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Fingerprint size={20} color="var(--blue-primary)" />
                  <span>Manual Biometric Gate Punch</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Record turnstile entry punch override for worker
                </p>
              </div>
              <button 
                onClick={() => setIsPunchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePunchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Select Worker *</label>
                <select 
                  className="input-field"
                  value={punchEmployeeCode}
                  onChange={(e) => setPunchEmployeeCode(e.target.value)}
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.employeeCode}>
                      {w.employeeCode} - {w.name} ({w.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--blue-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: 'var(--blue-primary)',
                fontWeight: 500,
              }}>
                Punches will be verified and mapped to Gate #1 Main Mill Entrance turnstile controller.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsPunchModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Fingerprint size={16} />
                  <span>Confirm Biometric Punch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};
