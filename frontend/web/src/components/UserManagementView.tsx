import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  Building2, 
  CheckCircle2, 
  X, 
  Edit3, 
  Lock, 
  Eye, 
  Key
} from 'lucide-react';
import type { RoleCode } from '../types';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchCode: 'LHR' | 'FSD' | 'KHI' | 'MUL' | 'ALL';
  branchName: string;
  role: RoleCode;
  roleName: string;
  hierarchyLevel: number;
  scope: 'enterprise' | 'branch' | 'department' | 'section' | 'line' | 'own';
  status: 'Active' | 'Suspended';
  is2FAEnabled: boolean;
  lastLogin: string;
}

export interface PermissionMatrixItem {
  module: string;
  name: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
}

export const UserManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'sod' | 'masking'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Initial Seeded System Users
  const [usersList, setUsersList] = useState<SystemUser[]>([
    {
      id: 'usr-owner-1',
      name: 'Mian Muhammad Mansha',
      email: 'owner@lahorefashion.com',
      phone: '0300-8450001',
      branchCode: 'ALL',
      branchName: 'All Branches (Enterprise HQ)',
      role: 'owner',
      roleName: 'Enterprise Owner & Chairman',
      hierarchyLevel: 1,
      scope: 'enterprise',
      status: 'Active',
      is2FAEnabled: false,
      lastLogin: 'Just now',
    },
    {
      id: 'usr-owner-2',
      name: 'Executive Director Operations',
      email: 'executive.director@lahorefashion.com',
      phone: '0300-8450002',
      branchCode: 'ALL',
      branchName: 'All Branches (Enterprise HQ)',
      role: 'owner',
      roleName: 'Executive Director (Owner)',
      hierarchyLevel: 1,
      scope: 'enterprise',
      status: 'Active',
      is2FAEnabled: false,
      lastLogin: 'Today, 08:30 AM',
    },
    {
      id: 'usr-1',
      name: 'Mian Tariq Saigol',
      email: 'admin@lahorefashion.com',
      phone: '0300-8451234',
      branchCode: 'ALL',
      branchName: 'All Branches (Enterprise HQ)',
      role: 'super_admin',
      roleName: 'Chief Executive / Super Admin',
      hierarchyLevel: 1,
      scope: 'enterprise',
      status: 'Active',
      is2FAEnabled: true,
      lastLogin: 'Today, 10:14 AM',
    },
    {
      id: 'usr-2',
      name: 'Farooq Ahmad HR',
      email: 'hr@lahorefashion.com',
      phone: '0321-4912831',
      branchCode: 'LHR',
      branchName: 'Lahore - Head Office & Weaving',
      role: 'hr_manager',
      roleName: 'HR & Labour Compliance Director',
      hierarchyLevel: 2,
      scope: 'enterprise',
      status: 'Active',
      is2FAEnabled: true,
      lastLogin: 'Today, 09:30 AM',
    },
    {
      id: 'usr-3',
      name: 'Rashid Minhas',
      email: 'production@lahorefashion.com',
      phone: '0333-7819201',
      branchCode: 'FSD',
      branchName: 'Faisalabad - Spinning & Greige',
      role: 'production_manager',
      roleName: 'General Production Manager',
      hierarchyLevel: 3,
      scope: 'branch',
      status: 'Active',
      is2FAEnabled: true,
      lastLogin: 'Yesterday, 04:45 PM',
    },
    {
      id: 'usr-4',
      name: 'Shahbaz Sharif Accounts',
      email: 'accounts@lahorefashion.com',
      phone: '0301-5519283',
      branchCode: 'LHR',
      branchName: 'Lahore - Head Office & Weaving',
      role: 'accountant',
      roleName: 'Senior Financial Controller',
      hierarchyLevel: 3,
      scope: 'branch',
      status: 'Active',
      is2FAEnabled: false,
      lastLogin: 'Oct 22, 11:20 AM',
    },
    {
      id: 'usr-5',
      name: 'Tariq Mehmood',
      email: 'supervisor@lahorefashion.com',
      phone: '0345-9912831',
      branchCode: 'LHR',
      branchName: 'Lahore - Unit 1 Weaving',
      role: 'supervisor',
      roleName: 'Weaving Line Supervisor',
      hierarchyLevel: 6,
      scope: 'line',
      status: 'Active',
      is2FAEnabled: false,
      lastLogin: 'Today, 07:05 AM',
    },
    {
      id: 'usr-6',
      name: 'Saeed Anwar Store',
      email: 'store@lahorefashion.com',
      phone: '0312-3341928',
      branchCode: 'FSD',
      branchName: 'Faisalabad Central Warehouse',
      role: 'store_keeper',
      roleName: 'Warehouse & Godown Incharge',
      hierarchyLevel: 5,
      scope: 'department',
      status: 'Active',
      is2FAEnabled: false,
      lastLogin: 'Oct 21, 02:15 PM',
    },
  ]);

  // Form State for Create/Edit User
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBranch, setFormBranch] = useState<'LHR' | 'FSD' | 'KHI' | 'MUL' | 'ALL'>('LHR');
  const [formRole, setFormRole] = useState<RoleCode>('supervisor');
  const [formScope, setFormScope] = useState<'enterprise' | 'branch' | 'department' | 'section' | 'line' | 'own'>('line');

  // Role Permissions Matrix State
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<RoleCode>('supervisor');
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<RoleCode, PermissionMatrixItem[]>>({
    owner: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    ],
    super_admin: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    ],
    hr_manager: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    supervisor: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: true, edit: true, delete: false, approve: false, export: false } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: false, delete: false, approve: false, export: false } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    production_manager: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: true, edit: true, delete: false, approve: false, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    accountant: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    store_keeper: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: true, edit: true, delete: false, approve: false, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    qc_inspector: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    branch_admin: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: true, create: true, edit: true, delete: false, approve: false, export: true } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
    ],
    worker: [
      { module: 'orders', name: 'Orders & Commercial Quotes', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'production', name: 'Spinning & Weaving Production', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'inventory', name: 'Yarn, Chemical & Fabric Stock', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'quality', name: 'QC 4-Point Audits', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'labour', name: 'Workers, Attendance & Piece-Rate', actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'payroll', name: 'Payroll & Bank Advice Disbursal', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'finance', name: 'Client Commercial Ledgers', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
      { module: 'settings', name: 'Mill System Settings & RBAC', actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false } },
    ]
  });

  // SoD Rules List
  const sodRules = [
    {
      code: 'SOD-RULE-01',
      title: 'Payroll Maker vs Checker Enforcement',
      conflicting: 'payroll:create vs payroll:approve',
      description: 'The operator or payroll manager who calculated the monthly payroll run CANNOT approve or post bank advice.',
      severity: 'CRITICAL',
      status: 'Active (Hard Block)',
    },
    {
      code: 'SOD-RULE-02',
      title: 'Commercial Order Booking vs Payment Waiver',
      conflicting: 'orders:create vs finance:approve',
      description: 'Merchandisers who book buyer orders cannot approve ledger write-offs or discount vouchers.',
      severity: 'HIGH RISK',
      status: 'Active (Hard Block)',
    },
    {
      code: 'SOD-RULE-03',
      title: 'Inventory GRN vs Damaged Stock Write-off',
      conflicting: 'inventory:create vs inventory:delete',
      description: 'Store keepers receiving raw yarn bobbins cannot authorize inventory write-offs.',
      severity: 'HIGH RISK',
      status: 'Active (Hard Block)',
    },
    {
      code: 'SOD-RULE-04',
      title: 'QC Release vs Outward Dispatch Gate Pass',
      conflicting: 'quality:approve vs delivery:create',
      description: 'QC Inspectors approving roll grading cannot generate their own gate pass challans.',
      severity: 'STATUTORY',
      status: 'Active (Hard Block)',
    },
  ];

  // Field Masking Policies
  const fieldPolicies = [
    { module: 'hr_employee', field: 'basic_salary', targetRole: 'supervisor', action: 'HIDE', description: 'Basic wage rate hidden for floor line supervisors' },
    { module: 'hr_employee', field: 'cnic', targetRole: 'supervisor', action: 'MASK', description: 'Worker CNIC masked (e.g. 35201-*****34-1)' },
    { module: 'hr_employee', field: 'basic_salary', targetRole: 'store_keeper', action: 'HIDE', description: 'Compensation confidential to warehouse incharge' },
    { module: 'clients', field: 'credit_limit', targetRole: 'supervisor', action: 'HIDE', description: 'Commercial credit terms hidden from manufacturing floor' },
    { module: 'finance', field: 'bank_account_no', targetRole: 'supervisor', action: 'MASK', description: 'Corporate IBAN masked for floor operators' },
  ];

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.roleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || u.branchCode === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormBranch('LHR');
    setFormRole('supervisor');
    setFormScope('line');
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone);
    setFormBranch(u.branchCode);
    setFormRole(u.role);
    setFormScope(u.scope);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const branchNames: Record<string, string> = {
      LHR: 'Lahore - Head Office & Weaving',
      FSD: 'Faisalabad - Spinning & Greige',
      KHI: 'Karachi - Export Apparel & Port',
      MUL: 'Multan - Raw Cotton Ginning',
      ALL: 'All Branches (Enterprise HQ)',
    };

    const roleNames: Record<RoleCode, string> = {
      owner: 'Enterprise Owner & Chairman',
      super_admin: 'Chief Executive / Super Admin',
      hr_manager: 'HR & Labour Compliance Director',
      production_manager: 'General Production Manager',
      accountant: 'Senior Financial Controller',
      supervisor: 'Weaving Line Supervisor',
      store_keeper: 'Warehouse & Godown Incharge',
      qc_inspector: 'Senior QC Inspector',
      branch_admin: 'Mill Branch Administrator',
      worker: 'Mill Floor Worker',
    };

    if (editingUser) {
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: formName,
        email: formEmail,
        phone: formPhone,
        branchCode: formBranch,
        branchName: branchNames[formBranch],
        role: formRole,
        roleName: roleNames[formRole],
        scope: formScope,
      } : u));
    } else {
      const newUser: SystemUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        branchCode: formBranch,
        branchName: branchNames[formBranch],
        role: formRole,
        roleName: roleNames[formRole],
        hierarchyLevel: formRole === 'owner' || formRole === 'super_admin' ? 1 : formRole.includes('manager') ? 3 : 5,
        scope: formScope,
        status: 'Active',
        is2FAEnabled: false,
        lastLogin: 'Never',
      };
      setUsersList(prev => [newUser, ...prev]);
    }

    setIsUserModalOpen(false);
  };

  const toggleUserStatus = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? {
      ...u,
      status: u.status === 'Active' ? 'Suspended' : 'Active'
    } : u));
  };

  const togglePermission = (role: RoleCode, moduleKey: string, actionKey: keyof PermissionMatrixItem['actions']) => {
    setPermissionsMatrix(prev => {
      const currentList = prev[role] || [];
      const updatedList = currentList.map(item => {
        if (item.module === moduleKey) {
          return {
            ...item,
            actions: {
              ...item.actions,
              [actionKey]: !item.actions[actionKey]
            }
          };
        }
        return item;
      });
      return { ...prev, [role]: updatedList };
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={24} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              User Administration & RBAC Access Matrix
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Role-Based Access Control, branch scoping, Segregation of Duties (SoD), and field-level privacy masking
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>Create Enterprise User</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM USERS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {usersList.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Accounts</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● {usersList.filter(u => u.status === 'Active').length} Active in Lahore Fashion Mill
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RBAC ROLES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            9 Defined
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Hierarchy L1 (Admin) to L7 (Worker)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOD SECURITY RULES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            {sodRules.length} Enforced
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Maker-Checker Hard-Block Active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FIELD MASKING POLICIES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {fieldPolicies.length} Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Supervisor & Store wage masking
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px' }}>
        {[
          { id: 'users', label: `Users Registry (${usersList.length})`, icon: Users },
          { id: 'matrix', label: 'Dynamic Permissions Matrix', icon: Key },
          { id: 'sod', label: 'Segregation of Duties (SoD)', icon: Lock },
          { id: 'masking', label: 'Field-Level Privacy Masking', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--blue-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '3px solid var(--blue-primary)' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Users Directory */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '420px', position: 'relative' }}>
              <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, email, or role title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Branch:</span>
              <select
                className="input-field"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{ width: 'auto', padding: '6px 30px 6px 12px', fontSize: '0.8rem' }}
              >
                <option value="ALL">All Branches</option>
                <option value="LHR">Lahore (LHR)</option>
                <option value="FSD">Faisalabad (FSD)</option>
                <option value="KHI">Karachi (KHI)</option>
                <option value="MUL">Multan (MUL)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>USER NAME & CONTACT</th>
                  <th style={{ padding: '12px 14px' }}>ROLE & HIERARCHY</th>
                  <th style={{ padding: '12px 14px' }}>MILL BRANCH</th>
                  <th style={{ padding: '12px 14px' }}>DATA SCOPE</th>
                  <th style={{ padding: '12px 14px' }}>LAST LOGIN</th>
                  <th style={{ padding: '12px 14px' }}>STATUS</th>
                  <th style={{ padding: '12px 14px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr 
                    key={u.id}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--blue-primary)' }}>{u.roleName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hierarchy Level {u.hierarchyLevel}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{u.branchName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {u.scope}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {u.lastLogin}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={u.status === 'Active' ? 'badge badge-emerald' : 'badge badge-rose'}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            color: u.status === 'Active' ? 'var(--rose)' : 'var(--emerald)',
                            borderColor: u.status === 'Active' ? 'var(--rose-border)' : 'var(--emerald-border)',
                          }}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Dynamic Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                Role-Based Atomic Permission Grid
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Select a role to inspect or modify action-level permissions across modules
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-dim)' }}>Target Role:</span>
              <select
                className="input-field"
                value={selectedRoleForMatrix}
                onChange={(e) => setSelectedRoleForMatrix(e.target.value as RoleCode)}
                style={{ width: 'auto', padding: '8px 36px 8px 14px', fontWeight: 700 }}
              >
                <option value="owner">Enterprise Owner & Chairman</option>
                <option value="super_admin">Chief Executive / Super Admin</option>
                <option value="hr_manager">HR & Labour Compliance Director</option>
                <option value="production_manager">General Production Manager</option>
                <option value="accountant">Senior Financial Controller</option>
                <option value="supervisor">Weaving Line Supervisor</option>
                <option value="store_keeper">Warehouse & Godown Incharge</option>
                <option value="qc_inspector">Senior QC Inspector</option>
                <option value="branch_admin">Mill Branch Administrator</option>
                <option value="worker">Mill Floor Worker</option>
              </select>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>MODULE / RESOURCE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>VIEW</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>CREATE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>EDIT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>DELETE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>APPROVE</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>EXPORT</th>
                </tr>
              </thead>
              <tbody>
                {(permissionsMatrix[selectedRoleForMatrix] || []).map((row) => (
                  <tr key={row.module} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.name}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        module: {row.module}
                      </span>
                    </td>
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(action => {
                      const isGranted = row.actions[action];
                      return (
                        <td key={action} style={{ padding: '14px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => togglePermission(selectedRoleForMatrix, row.module, action)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: 'var(--blue-primary)',
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Segregation of Duties (SoD) */}
      {activeTab === 'sod' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--blue-light)', border: '1px solid #bfdbfe', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--blue-dark)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} />
              <span>Maker-Checker Conflict Prevention Rules</span>
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
              The system automatically rejects requests when a user attempts to approve an operational or financial entity they created.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {sodRules.map(rule => (
              <div key={rule.code} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-primary)' }}>
                      {rule.code}
                    </span>
                    <span className={rule.severity === 'CRITICAL' ? 'badge badge-rose' : 'badge badge-gold'} style={{ fontSize: '0.68rem' }}>
                      {rule.severity}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: '2px 0 6px 0' }}>
                    {rule.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                    {rule.description}
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Conflicting Claims: <strong>{rule.conflicting}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-emerald" style={{ padding: '6px 12px' }}>
                    <CheckCircle2 size={13} />
                    <span>{rule.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Field-Level Masking Policies */}
      {activeTab === 'masking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
              Dynamic Field Privacy & Masking Policies
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Enforces privacy across UI views and REST APIs. Sensitive fields are redacted based on user role assignments.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 14px' }}>MODULE</th>
                  <th style={{ padding: '12px 14px' }}>SENSITIVE FIELD NAME</th>
                  <th style={{ padding: '12px 14px' }}>RESTRICTED ROLE</th>
                  <th style={{ padding: '12px 14px' }}>POLICY ACTION</th>
                  <th style={{ padding: '12px 14px' }}>BEHAVIOR</th>
                </tr>
              </thead>
              <tbody>
                {fieldPolicies.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.module}</td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                      {p.field}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>
                      <span className="badge badge-blue">{p.targetRole}</span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={p.action === 'HIDE' ? 'badge badge-rose' : 'badge badge-gold'}>
                        {p.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)' }}>
                      {p.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div 
            className="modal-content animate-fade-in" 
            style={{ maxWidth: '620px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
                  {editingUser ? 'Edit Enterprise User Profile' : 'Create New Enterprise User'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Configure role assignment, branch tenancy and security scopes
                </p>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid-2">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Asad Qureshi"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@lahorefashion.com"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="label">Phone / WhatsApp</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0300-1234567"
                  />
                </div>
                <div>
                  <label className="label">Primary Mill Branch *</label>
                  <select
                    className="input-field"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as any)}
                  >
                    <option value="LHR">Lahore - Head Office & Weaving</option>
                    <option value="FSD">Faisalabad - Spinning & Greige</option>
                    <option value="KHI">Karachi - Export Apparel & Port</option>
                    <option value="MUL">Multan - Raw Cotton Ginning</option>
                    <option value="ALL">All Branches (HQ Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="label">Operational Role *</label>
                  <select
                    className="input-field"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as RoleCode)}
                  >
                    <option value="owner">Enterprise Owner & Chairman (L1)</option>
                    <option value="super_admin">Chief Executive / Super Admin (L1)</option>
                    <option value="hr_manager">HR Compliance Director (L2)</option>
                    <option value="production_manager">General Production Manager (L3)</option>
                    <option value="accountant">Senior Financial Controller (L3)</option>
                    <option value="supervisor">Weaving Line Supervisor (L6)</option>
                    <option value="store_keeper">Warehouse Incharge (L5)</option>
                    <option value="qc_inspector">Senior QC Inspector (L4)</option>
                    <option value="branch_admin">Mill Branch Administrator (L2)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Hierarchical Data Scope *</label>
                  <select
                    className="input-field"
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value as any)}
                  >
                    <option value="enterprise">Enterprise (All Mills)</option>
                    <option value="branch">Branch (Assigned Mill Only)</option>
                    <option value="department">Department</option>
                    <option value="section">Section</option>
                    <option value="line">Line / Machine (Supervisor)</option>
                    <option value="own">Self Only (Worker / Staff)</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User Access' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
