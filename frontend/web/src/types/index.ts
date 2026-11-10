export type RoleCode =
  | 'owner'
  | 'super_admin'
  | 'branch_admin'
  | 'production_manager'
  | 'accountant'
  | 'store_keeper'
  | 'qc_inspector'
  | 'hr_manager'
  | 'supervisor'
  | 'worker';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  is_head_office: boolean;
  address?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  employee_id?: string;
  default_branch?: Branch;
  role: RoleCode;
  role_display: string;
  department?: string;
  is_2fa_enabled: boolean;
  avatar?: string;
  permissions?: string[];
}

export type ModuleKey =
  | 'dashboard'
  | 'clients'
  | 'orders'
  | 'production'
  | 'floor'
  | 'floor-entry'
  | 'kiosk'
  | 'inventory'
  | 'quality'
  | 'hr'
  | 'labour'
  | 'attendance'
  | 'delivery'
  | 'finance'
  | 'reports'
  | 'notifications'
  | 'audit'
  | 'settings'
  | 'users'
  | 'print'
  | 'sync'
  | 'admin'
  | 'portals';

export interface KioskDeviceItem {
  id: string;
  deviceCode: string;
  name: string;
  department: string;
  line: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  ipAddress: string;
  batteryLevel: number;
  appVersion: string;
  isLocked: boolean;
  lastHeartbeat: string;
}

export interface FloorOutputItem {
  id: string;
  clientUuid: string;
  bundleId: string;
  lotNumber: string;
  operationId: string;
  operationName: string;
  workerId: string;
  workerName: string;
  workerCode: string;
  kioskCode: string;
  channel: 'KIOSK' | 'MOBILE' | 'MACHINE_IOT' | 'SUPERVISOR_WEB' | 'WHATSAPP_BOT' | 'PAPER_LATE';
  qtyGood: number;
  qtyReject: number;
  rejectReason?: string;
  unitRatePKR: number;
  earningsPreviewPKR: number;
  occurredAt: string;
  isLateEntry: boolean;
  lateReason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADJUSTED';
  anomalyFlag?: string;
  supervisorNotes?: string;
}

export interface FloorAnomalyItem {
  id: string;
  entryId?: string;
  workerName: string;
  workerCode: string;
  anomalyType: 'SPIKE_OUTPUT' | 'DUAL_MACHINE' | 'ABSENT_OUTPUT' | 'ROUND_NUMBER' | 'TOO_FAST_SCANS' | 'END_SHIFT_BURST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  flaggedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolutionNotes?: string;
}

export interface StoppageEventItem {
  id: string;
  machineId: string;
  operatorName: string;
  reasonCode: string;
  reasonDisplayUr: string;
  startedAt: string;
  durationMinutes: number;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface ProductionStage {
  id: string;
  name: string;
  code: string;
  count: number;
  unit: string;
  efficiency: number;
  status: 'normal' | 'busy' | 'bottleneck';
}

export interface FactoryKPIs {
  activeLots: number;
  dailyMetres: number;
  activeWorkers: number;
  overallEfficiency: number;
  pendingDeliveries: number;
  qualityPassRate: number;
}

export type PortalSlug =
  | 'owner'
  | 'manager'
  | 'dept'
  | 'hr'
  | 'finance'
  | 'stores'
  | 'qc'
  | 'planning'
  | 'maintenance'
  | 'floor'
  | 'kiosk'
  | 'client'
  | 'partner'
  | 'audit'
  | 'admin';

export interface PortalTheme {
  accent: string;
  primary: string;
  surface: string;
  sidebar_bg: string;
  tag: string;
}

export interface PortalNavItemConfig {
  id: string;
  module: string;
  resource?: string;
  label: string;
  label_ur?: string;
  icon: string;
  route: string;
  order: number;
  badge?: string;
  required_permission?: string;
  children?: PortalNavItemConfig[];
}

export interface PortalMeta {
  id: string;
  code: string;
  name: string;
  slug: PortalSlug;
  description: string;
  theme_json: PortalTheme;
  login_title: string;
  login_subtitle: string;
  hero_image: string;
  landing_route: string;
  allowed_roles: string[];
  session_timeout_minutes: number;
  require_2fa: boolean;
  last_accessed_at?: string;
  unread_notifications?: number;
}

