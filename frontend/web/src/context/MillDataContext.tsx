import React, { createContext, useContext, useState } from 'react';

export interface OrderItem {
  id: string;
  orderNumber: string;
  clientName: string;
  fabricSpec: string;
  construction: string;
  quantityMetres: number;
  ratePerMetre: number;
  totalAmountPKR: number;
  deliveryDate: string;
  orderDate: string;
  status: 'Draft' | 'Confirmed' | 'Weaving' | 'Dyeing' | 'Printing' | 'Packing' | 'Dispatched' | 'Delivered';
  branchCode: string;
  remarks?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  brandType: 'Retail Fashion' | 'Home Textile' | 'Denim Apparel' | 'Export House';
  city: 'Lahore' | 'Karachi' | 'Faisalabad' | 'Multan';
  ntn: string;
  strn: string;
  creditLimitPKR: number;
  currentBalancePKR: number;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Review' | 'Suspended';
}

export interface ProductionLot {
  id: string;
  lotNumber: string;
  orderNumber: string;
  clientName: string;
  fabricSpec: string;
  stageCode: 'YARN' | 'WEAVING' | 'GREY_INSPECT' | 'DYEING' | 'PRINTING' | 'CUTTING' | 'STITCHING' | 'PACKING' | 'DISPATCH';
  stageName: string;
  targetMetres: number;
  producedMetres: number;
  loomNumber: string;
  supervisorName: string;
  efficiencyPercent: number;
  status: 'Optimal' | 'Running' | 'QC Check' | 'Bottleneck' | 'Completed';
  lastScanTime: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'Yarn Bobbins' | 'Grey Fabric' | 'Dyes & Chemicals' | 'Finished Fabric' | 'Trims & Accessories';
  currentStock: number;
  unit: string;
  reorderLevel: number;
  warehouseLocation: string;
  unitCostPKR: number;
  lastReceivedDate: string;
}

export interface QCAudit {
  id: string;
  auditNumber: string;
  lotNumber: string;
  fabricSpec: string;
  rollNumber: string;
  inspectedMetres: number;
  totalDefectPoints: number;
  pointsPer100M: number;
  result: 'Pass - Grade A' | 'Pass - Grade B' | 'Fail - Defective';
  auditorName: string;
  timestamp: string;
  defectBreakdown: { warpStreak: number; slub: number; hole: number; shadeVar: number; oilStain: number };
}

export interface WorkerItem {
  id: string;
  employeeCode: string;
  name: string;
  department: 'Weave Shed' | 'Dye House' | 'Rotary Printing' | 'Stitching Line' | 'QC Inspection' | 'Warehouse';
  skillGrade: 'Master (A+)' | 'Senior (A)' | 'Operator (B)' | 'Helper (C)';
  shift: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';
  cnic: string;
  phone: string;
  dailyRatePKR: number;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface AttendanceEntry {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  shift: string;
  clockIn: string;
  clockOut?: string;
  biometricGate: string;
  status: 'On Time' | 'Late' | 'Shift Complete';
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  orderNumber: string;
  clientName: string;
  destinationCity: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  totalRolls: number;
  totalMetres: number;
  gatePassTime: string;
  status: 'Gate Pass Issued' | 'In Transit' | 'Delivered & Signed';
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  clientName: string;
  subtotalPKR: number;
  salesTaxPKR: number;
  whtPKR: number;
  netPayablePKR: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface MillDataContextType {
  orders: OrderItem[];
  addOrder: (order: Omit<OrderItem, 'id' | 'orderNumber' | 'totalAmountPKR' | 'orderDate'>) => void;
  updateOrderStatus: (id: string, status: OrderItem['status']) => void;

  clients: ClientItem[];
  addClient: (client: Omit<ClientItem, 'id' | 'currentBalancePKR'>) => void;

  lots: ProductionLot[];
  addLot: (lot: Omit<ProductionLot, 'id' | 'lotNumber' | 'lastScanTime' | 'producedMetres'>) => void;
  advanceLotStage: (id: string) => void;

  inventory: InventoryItem[];
  addStockItem: (item: Omit<InventoryItem, 'id' | 'code' | 'lastReceivedDate'>) => void;

  qcAudits: QCAudit[];
  addQCAudit: (audit: Omit<QCAudit, 'id' | 'auditNumber' | 'timestamp' | 'pointsPer100M' | 'result'>) => void;

  workers: WorkerItem[];
  addWorker: (worker: Omit<WorkerItem, 'id' | 'employeeCode'>) => void;
  updateWorker: (worker: WorkerItem) => void;
  deleteWorker: (id: string) => void;

  attendance: AttendanceEntry[];
  recordClockIn: (employeeCode: string, name: string, department: string, shift: string) => void;

  challans: DeliveryChallan[];
  addChallan: (challan: Omit<DeliveryChallan, 'id' | 'challanNumber' | 'gatePassTime'>) => void;
  markChallanDelivered: (id: string) => void;

  invoices: InvoiceItem[];
  addInvoice: (invoice: Omit<InvoiceItem, 'id' | 'invoiceNumber' | 'salesTaxPKR' | 'whtPKR' | 'netPayablePKR' | 'issueDate'>) => void;
  markInvoicePaid: (id: string) => void;

  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

const MillDataContext = createContext<MillDataContextType | undefined>(undefined);

export const MillDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Live Orders
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: 'ord-1',
      orderNumber: 'PO-LF-2026-8841',
      clientName: 'Khaadi Apparel',
      fabricSpec: 'Lawn Printed Kurti 80/80',
      construction: '80x80 / 100x90 40s Cotton',
      quantityMetres: 24000,
      ratePerMetre: 285,
      totalAmountPKR: 6840000,
      deliveryDate: '2026-11-15',
      orderDate: '2026-10-18',
      status: 'Printing' as const,
      branchCode: 'LHR',
      remarks: 'Reactive print, export quality shrinkage < 2%'
    },
    {
      id: 'ord-2',
      orderNumber: 'PO-LF-2026-8840',
      clientName: 'Sapphire Retail',
      fabricSpec: 'Stretch Denim Twill 11.5oz',
      construction: '10s x 70D / 68x42 Indigo',
      quantityMetres: 45000,
      ratePerMetre: 410,
      totalAmountPKR: 18450000,
      deliveryDate: '2026-11-30',
      orderDate: '2026-10-12',
      status: 'Weaving' as const,
      branchCode: 'FSD',
      remarks: 'Ring spun warp with Lycra stretch'
    },
    {
      id: 'ord-3',
      orderNumber: 'PO-LF-2026-8839',
      clientName: 'J. Junaid Jamshed',
      fabricSpec: 'Luxury Jacquard Kurta Suiting',
      construction: '60s x 60s / 120x80 Dobby Weave',
      quantityMetres: 18500,
      ratePerMetre: 520,
      totalAmountPKR: 9620000,
      deliveryDate: '2026-11-08',
      orderDate: '2026-10-05',
      status: 'Dyeing' as const,
      branchCode: 'LHR',
      remarks: 'Mercerized finish with soft hand feel'
    },
    {
      id: 'ord-4',
      orderNumber: 'PO-LF-2026-8838',
      clientName: 'Gul Ahmed Intl',
      fabricSpec: 'Cotton Pique Knit Polo',
      construction: '30s Combed Cotton Knit 220 GSM',
      quantityMetres: 15000,
      ratePerMetre: 340,
      totalAmountPKR: 5100000,
      deliveryDate: '2026-11-20',
      orderDate: '2026-10-14',
      status: 'Confirmed' as const,
      branchCode: 'KHI',
      remarks: 'Vat dyed jet navy with bio-wash'
    },
    {
      id: 'ord-5',
      orderNumber: 'PO-LF-2026-8837',
      clientName: 'Nishat Linen',
      fabricSpec: 'Percale Bedding 300TC',
      construction: '40s x 40s / 150x150 100% Combed',
      quantityMetres: 32000,
      ratePerMetre: 315,
      totalAmountPKR: 10080000,
      deliveryDate: '2026-11-10',
      orderDate: '2026-10-02',
      status: 'Packing' as const,
      branchCode: 'LHR',
      remarks: 'Ultra smooth anti-pilling singeing'
    }
  ]);

  // 2. Clients
  const [clients, setClients] = useState<ClientItem[]>([
    { id: 'cli-1', name: 'Khaadi Apparel', brandType: 'Retail Fashion', city: 'Karachi', ntn: '2849102-4', strn: '1700284910219', creditLimitPKR: 35000000, currentBalancePKR: 14200000, contactPerson: 'Tariq Mehmood (VP Sourcing)', phone: '+92 300 8472911', email: 'sourcing@khaadi.com', status: 'Active' },
    { id: 'cli-2', name: 'Sapphire Retail', brandType: 'Denim Apparel', city: 'Lahore', ntn: '1940291-7', strn: '1700194029115', creditLimitPKR: 40000000, currentBalancePKR: 18450000, contactPerson: 'Bilal Chaudhry (Supply Chain)', phone: '+92 321 4455882', email: 'b.chaudhry@sapphire.pk', status: 'Active' },
    { id: 'cli-3', name: 'J. Junaid Jamshed', brandType: 'Retail Fashion', city: 'Karachi', ntn: '3349182-1', strn: '1700334918214', creditLimitPKR: 25000000, currentBalancePKR: 9620000, contactPerson: 'Faizan Sheikh (Head Merchandising)', phone: '+92 301 9283741', email: 'merch@jjunaidjamshed.com', status: 'Active' },
    { id: 'cli-4', name: 'Gul Ahmed Intl', brandType: 'Home Textile', city: 'Karachi', ntn: '0812934-8', strn: '1700081293411', creditLimitPKR: 30000000, currentBalancePKR: 5100000, contactPerson: 'Asadullah Khan', phone: '+92 333 7162534', email: 'procurement@gulahmed.com', status: 'Active' },
    { id: 'cli-5', name: 'Nishat Linen', brandType: 'Home Textile', city: 'Lahore', ntn: '0719283-5', strn: '1700071928318', creditLimitPKR: 35000000, currentBalancePKR: 10080000, contactPerson: 'Hamza Mansha', phone: '+92 300 5544332', email: 'orders@nishatlinen.com', status: 'Active' },
    { id: 'cli-6', name: 'Alkaram Studio', brandType: 'Retail Fashion', city: 'Karachi', ntn: '2194820-3', strn: '1700219482012', creditLimitPKR: 20000000, currentBalancePKR: 3800000, contactPerson: 'Salman Alkaram', phone: '+92 322 8192837', email: 'textiles@alkaram.com', status: 'Active' },
    { id: 'cli-7', name: 'Outfitters Clothing Co.', brandType: 'Retail Fashion', city: 'Lahore', ntn: '4019283-9', strn: '1700401928316', creditLimitPKR: 15000000, currentBalancePKR: 4200000, contactPerson: 'Kamran Mirza', phone: '+92 302 4433221', email: 'kamran@outfitters.com.pk', status: 'Active' },
    { id: 'cli-8', name: 'Edenrobe Garments', brandType: 'Retail Fashion', city: 'Karachi', ntn: '1827364-2', strn: '1700182736410', creditLimitPKR: 18000000, currentBalancePKR: 6200000, contactPerson: 'Zubair Qureshi', phone: '+92 334 9988776', email: 'orders@edenrobe.com', status: 'Active' }
  ]);

  // 3. Production Lots
  const [lots, setLots] = useState<ProductionLot[]>([
    { id: 'lot-1', lotNumber: 'LOT-LF-8841', orderNumber: 'PO-LF-2026-8841', clientName: 'Khaadi Apparel', fabricSpec: 'Lawn Printed Kurti 80/80', stageCode: 'PRINTING', stageName: 'Rotary Print', targetMetres: 24000, producedMetres: 19500, loomNumber: 'PRINT-RO-02', supervisorName: 'Ustad Shaukat', efficiencyPercent: 94, status: 'Running', lastScanTime: '5m ago' },
    { id: 'lot-2', lotNumber: 'LOT-LF-8840', orderNumber: 'PO-LF-2026-8840', clientName: 'Sapphire Retail', fabricSpec: 'Stretch Denim Twill 11.5oz', stageCode: 'WEAVING', stageName: 'Weaving Shed #02', targetMetres: 45000, producedMetres: 31200, loomNumber: 'PICANOL-LM-14', supervisorName: 'Rana Mumtaz', efficiencyPercent: 96, status: 'Optimal', lastScanTime: '12m ago' },
    { id: 'lot-3', lotNumber: 'LOT-LF-8839', orderNumber: 'PO-LF-2026-8839', clientName: 'J. Junaid Jamshed', fabricSpec: 'Luxury Jacquard Kurta', stageCode: 'DYEING', stageName: 'Dyeing Jet Vat #3', targetMetres: 18500, producedMetres: 14200, loomNumber: 'JET-DYE-03', supervisorName: 'Irfan Cheema', efficiencyPercent: 90, status: 'QC Check', lastScanTime: '24m ago' },
    { id: 'lot-4', lotNumber: 'LOT-LF-8838', orderNumber: 'PO-LF-2026-8838', clientName: 'Gul Ahmed Intl', fabricSpec: 'Cotton Pique Polo', stageCode: 'WEAVING', stageName: 'Knitting Circular #06', targetMetres: 15000, producedMetres: 8400, loomNumber: 'CIRC-KNIT-06', supervisorName: 'Nadeem Akhtar', efficiencyPercent: 92, status: 'Running', lastScanTime: '40m ago' },
    { id: 'lot-5', lotNumber: 'LOT-LF-8837', orderNumber: 'PO-LF-2026-8837', clientName: 'Nishat Linen', fabricSpec: 'Percale Bedding 300TC', stageCode: 'PACKING', stageName: 'QC & Packaging', targetMetres: 32000, producedMetres: 31800, loomNumber: 'FIN-PACK-01', supervisorName: 'Bashir Ahmed', efficiencyPercent: 98, status: 'Completed', lastScanTime: '1h ago' }
  ]);

  // 4. Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv-1', code: 'YRN-C40-01', name: '40/1 Combed Cotton Cone Yarn', category: 'Yarn Bobbins', currentStock: 24500, unit: 'kg', reorderLevel: 8000, warehouseLocation: 'Godown A - Rack 04', unitCostPKR: 850, lastReceivedDate: '2026-10-20' },
    { id: 'inv-2', code: 'YRN-IND-02', name: '10s Indigo Ring Spun Yarn', category: 'Yarn Bobbins', currentStock: 18200, unit: 'kg', reorderLevel: 5000, warehouseLocation: 'Godown A - Rack 12', unitCostPKR: 720, lastReceivedDate: '2026-10-19' },
    { id: 'inv-3', code: 'FAB-GRY-80', name: 'Grey Lawn Fabric 80x80 Rolls', category: 'Grey Fabric', currentStock: 68400, unit: 'metres', reorderLevel: 20000, warehouseLocation: 'Godown B - Weave Store', unitCostPKR: 195, lastReceivedDate: '2026-10-21' },
    { id: 'inv-4', code: 'CHM-REC-BL', name: 'Reactive Blue RGB Dye Granules', category: 'Dyes & Chemicals', currentStock: 3200, unit: 'kg', reorderLevel: 1000, warehouseLocation: 'Chemical Vault #01', unitCostPKR: 2400, lastReceivedDate: '2026-10-15' },
    { id: 'inv-5', code: 'CHM-HYD-01', name: 'Sodium Hydrosulfite (Hydro)', category: 'Dyes & Chemicals', currentStock: 5400, unit: 'kg', reorderLevel: 1500, warehouseLocation: 'Chemical Vault #02', unitCostPKR: 420, lastReceivedDate: '2026-10-18' },
    { id: 'inv-6', code: 'FAB-DNM-11', name: 'Finished Stretch Denim 11.5oz', category: 'Finished Fabric', currentStock: 28500, unit: 'metres', reorderLevel: 10000, warehouseLocation: 'Godown C - Dispatch', unitCostPKR: 380, lastReceivedDate: '2026-10-22' },
  ]);

  // 5. QC Audits
  const [qcAudits, setQcAudits] = useState<QCAudit[]>([
    {
      id: 'qc-1',
      auditNumber: 'QC-LF-2026-0491',
      lotNumber: 'LOT-LF-8841',
      fabricSpec: 'Lawn Printed Kurti 80/80',
      rollNumber: 'ROLL-084',
      inspectedMetres: 120,
      totalDefectPoints: 8,
      pointsPer100M: 6.67,
      result: 'Pass - Grade A',
      auditorName: 'M. Kashif (Senior QC)',
      timestamp: '2026-10-22 14:15',
      defectBreakdown: { warpStreak: 1, slub: 2, hole: 0, shadeVar: 0, oilStain: 1 }
    },
    {
      id: 'qc-2',
      auditNumber: 'QC-LF-2026-0490',
      lotNumber: 'LOT-LF-8840',
      fabricSpec: 'Stretch Denim Twill 11.5oz',
      rollNumber: 'ROLL-119',
      inspectedMetres: 150,
      totalDefectPoints: 12,
      pointsPer100M: 8.0,
      result: 'Pass - Grade A',
      auditorName: 'M. Kashif (Senior QC)',
      timestamp: '2026-10-22 12:40',
      defectBreakdown: { warpStreak: 2, slub: 3, hole: 0, shadeVar: 1, oilStain: 0 }
    },
    {
      id: 'qc-3',
      auditNumber: 'QC-LF-2026-0489',
      lotNumber: 'LOT-LF-8839',
      fabricSpec: 'Luxury Jacquard Kurta',
      rollNumber: 'ROLL-052',
      inspectedMetres: 100,
      totalDefectPoints: 26,
      pointsPer100M: 26.0,
      result: 'Pass - Grade B',
      auditorName: 'Tanveer Sajjad',
      timestamp: '2026-10-22 10:20',
      defectBreakdown: { warpStreak: 5, slub: 4, hole: 1, shadeVar: 2, oilStain: 2 }
    }
  ]);

  // 6. Workers
  const [workers, setWorkers] = useState<WorkerItem[]>([
    { id: 'w-1', employeeCode: 'EMP-LF-104', name: 'Muhammad Yasin', department: 'Weave Shed', skillGrade: 'Master (A+)', shift: 'Shift A (Morning)', cnic: '35202-1928471-3', phone: '+92 302 9182736', dailyRatePKR: 1950, status: 'Active' },
    { id: 'w-2', employeeCode: 'EMP-LF-105', name: 'Ghulam Rasool', department: 'Weave Shed', skillGrade: 'Senior (A)', shift: 'Shift A (Morning)', cnic: '35201-8273641-5', phone: '+92 301 8273645', dailyRatePKR: 1650, status: 'Active' },
    { id: 'w-3', employeeCode: 'EMP-LF-106', name: 'Zahid Hussain', department: 'Dye House', skillGrade: 'Senior (A)', shift: 'Shift A (Morning)', cnic: '35202-7364521-9', phone: '+92 321 7364521', dailyRatePKR: 1750, status: 'Active' },
    { id: 'w-4', employeeCode: 'EMP-LF-107', name: 'Muhammad Shahid', department: 'Rotary Printing', skillGrade: 'Master (A+)', shift: 'Shift B (Evening)', cnic: '35200-6453721-1', phone: '+92 333 6453721', dailyRatePKR: 2100, status: 'Active' },
    { id: 'w-5', employeeCode: 'EMP-LF-108', name: 'Abdul Ghafoor', department: 'QC Inspection', skillGrade: 'Senior (A)', shift: 'Shift A (Morning)', cnic: '35202-5362718-7', phone: '+92 300 5362718', dailyRatePKR: 1800, status: 'Active' },
  ]);

  // 7. Attendance
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([
    { id: 'att-1', employeeCode: 'EMP-LF-104', name: 'Muhammad Yasin', department: 'Weave Shed', shift: 'Shift A (Morning)', clockIn: '05:54 AM', biometricGate: 'Gate #1 Main Turnstile', status: 'On Time' },
    { id: 'att-2', employeeCode: 'EMP-LF-105', name: 'Ghulam Rasool', department: 'Weave Shed', shift: 'Shift A (Morning)', clockIn: '05:58 AM', biometricGate: 'Gate #1 Main Turnstile', status: 'On Time' },
    { id: 'att-3', employeeCode: 'EMP-LF-106', name: 'Zahid Hussain', department: 'Dye House', shift: 'Shift A (Morning)', clockIn: '06:02 AM', biometricGate: 'Gate #2 Wet Processing', status: 'On Time' },
    { id: 'att-4', employeeCode: 'EMP-LF-107', name: 'Muhammad Shahid', department: 'Rotary Printing', shift: 'Shift A (Morning)', clockIn: '06:18 AM', biometricGate: 'Gate #1 Main Turnstile', status: 'Late' },
    { id: 'att-5', employeeCode: 'EMP-LF-108', name: 'Abdul Ghafoor', department: 'QC Inspection', shift: 'Shift A (Morning)', clockIn: '05:50 AM', biometricGate: 'Gate #3 QC & Lab', status: 'On Time' },
  ]);

  // 8. Delivery Challans
  const [challans, setChallans] = useState<DeliveryChallan[]>([
    {
      id: 'ch-1',
      challanNumber: 'DC-LF-2026-0381',
      orderNumber: 'PO-LF-2026-8837',
      clientName: 'Nishat Linen',
      destinationCity: 'Lahore (Nishat Mills Emporium)',
      vehicleNumber: 'LES-26-8812',
      driverName: 'Rafiq Gujjar',
      driverPhone: '+92 300 4829102',
      totalRolls: 64,
      totalMetres: 31800,
      gatePassTime: '2026-10-22 13:30',
      status: 'In Transit'
    },
    {
      id: 'ch-2',
      challanNumber: 'DC-LF-2026-0380',
      orderNumber: 'PO-LF-2026-8835',
      clientName: 'Khaadi Apparel',
      destinationCity: 'Karachi (Korangi Industrial Area)',
      vehicleNumber: 'TKL-4091 Container',
      driverName: 'Sher Khan',
      driverPhone: '+92 321 8492019',
      totalRolls: 90,
      totalMetres: 42000,
      gatePassTime: '2026-10-21 17:45',
      status: 'Delivered & Signed'
    }
  ]);

  // 9. Invoices
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-LF-2026-0194',
      orderNumber: 'PO-LF-2026-8837',
      clientName: 'Nishat Linen',
      subtotalPKR: 10080000,
      salesTaxPKR: 1814400,
      whtPKR: 100800,
      netPayablePKR: 11793600,
      issueDate: '2026-10-22',
      dueDate: '2026-11-21',
      status: 'Pending'
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-LF-2026-0193',
      orderNumber: 'PO-LF-2026-8835',
      clientName: 'Khaadi Apparel',
      subtotalPKR: 12450000,
      salesTaxPKR: 2241000,
      whtPKR: 124500,
      netPayablePKR: 14566500,
      issueDate: '2026-10-18',
      dueDate: '2026-11-17',
      status: 'Paid'
    }
  ]);

  // 10. Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([
    {
      id: 'welcome-toast',
      type: 'info',
      title: 'Enterprise ERP Online',
      message: 'Lahore Fashion Textile Suite synchronized with live mill telemetry.'
    }
  ]);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Actions
  const addOrder = (orderData: Omit<OrderItem, 'id' | 'orderNumber' | 'totalAmountPKR' | 'orderDate'>) => {
    const newId = 'ord-' + Date.now();
    const orderNum = `PO-LF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = orderData.quantityMetres * orderData.ratePerMetre;
    const today = new Date().toISOString().split('T')[0];

    const newOrder: OrderItem = {
      id: newId,
      orderNumber: orderNum,
      totalAmountPKR: totalAmount,
      orderDate: today,
      ...orderData
    };

    setOrders(prev => [newOrder, ...prev]);
    showToast('Order Created Successfully', `${orderNum} for ${orderData.clientName} booked at PKR ${totalAmount.toLocaleString()}`);
  };

  const updateOrderStatus = (id: string, status: OrderItem['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast('Status Updated', `Order status progressed to ${status}`);
  };

  const addClient = (clientData: Omit<ClientItem, 'id' | 'currentBalancePKR'>) => {
    const newId = 'cli-' + Date.now();
    const newClient: ClientItem = {
      id: newId,
      currentBalancePKR: 0,
      ...clientData
    };
    setClients(prev => [newClient, ...prev]);
    showToast('New Client Registered', `${clientData.name} enrolled with PKR ${(clientData.creditLimitPKR / 1000000).toFixed(1)}M credit limit`);
  };

  const addLot = (lotData: Omit<ProductionLot, 'id' | 'lotNumber' | 'lastScanTime' | 'producedMetres'>) => {
    const newId = 'lot-' + Date.now();
    const lotNum = `LOT-LF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLot: ProductionLot = {
      id: newId,
      lotNumber: lotNum,
      producedMetres: 0,
      lastScanTime: 'Just now',
      ...lotData
    };
    setLots(prev => [newLot, ...prev]);
    showToast('Production Lot Issued', `${lotNum} assigned to ${lotData.loomNumber} for ${lotData.clientName}`);
  };

  const advanceLotStage = (id: string) => {
    const stageFlow: ProductionLot['stageCode'][] = [
      'YARN', 'WEAVING', 'GREY_INSPECT', 'DYEING', 'PRINTING', 'CUTTING', 'STITCHING', 'PACKING', 'DISPATCH'
    ];
    const stageNames: Record<ProductionLot['stageCode'], string> = {
      YARN: 'Yarn Bobbin',
      WEAVING: 'Weaving Shed',
      GREY_INSPECT: 'Grey Inspection',
      DYEING: 'Dyeing Jet House',
      PRINTING: 'Rotary Print',
      CUTTING: 'Laser Cutting',
      STITCHING: 'Stitching Lines',
      PACKING: 'QC & Packaging',
      DISPATCH: 'Export Dispatch'
    };

    setLots(prev => prev.map(lot => {
      if (lot.id !== id) return lot;
      const curIndex = stageFlow.indexOf(lot.stageCode);
      const nextIndex = Math.min(curIndex + 1, stageFlow.length - 1);
      const nextCode = stageFlow[nextIndex];
      const nextName = stageNames[nextCode];
      showToast('Lot Advanced Stage', `${lot.lotNumber} advanced to ${nextName}`);
      return {
        ...lot,
        stageCode: nextCode,
        stageName: nextName,
        status: nextIndex === stageFlow.length - 1 ? 'Completed' : 'Running',
        lastScanTime: 'Just now'
      };
    }));
  };

  const addStockItem = (itemData: Omit<InventoryItem, 'id' | 'code' | 'lastReceivedDate'>) => {
    const newId = 'inv-' + Date.now();
    const prefix = itemData.category === 'Yarn Bobbins' ? 'YRN' : itemData.category === 'Grey Fabric' ? 'FAB' : itemData.category === 'Dyes & Chemicals' ? 'CHM' : 'TRM';
    const code = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const newItem: InventoryItem = {
      id: newId,
      code,
      lastReceivedDate: today,
      ...itemData
    };
    setInventory(prev => [newItem, ...prev]);
    showToast('Material Received (GRN)', `${newItem.code} - ${newItem.name} added to stock (${newItem.currentStock} ${newItem.unit})`);
  };

  const addQCAudit = (auditData: Omit<QCAudit, 'id' | 'auditNumber' | 'timestamp' | 'pointsPer100M' | 'result'>) => {
    const newId = 'qc-' + Date.now();
    const auditNum = `QC-LF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const pts = (auditData.totalDefectPoints * 100) / auditData.inspectedMetres;
    const pointsPer100M = Number(pts.toFixed(1));
    const result: QCAudit['result'] = pointsPer100M <= 15 ? 'Pass - Grade A' : pointsPer100M <= 28 ? 'Pass - Grade B' : 'Fail - Defective';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newAudit: QCAudit = {
      id: newId,
      auditNumber: auditNum,
      timestamp: now,
      pointsPer100M,
      result,
      ...auditData
    };
    setQcAudits(prev => [newAudit, ...prev]);
    showToast('QC Audit Logged', `${auditNum} for ${auditData.lotNumber}: ${result} (${pointsPer100M} pts/100m)`);
  };

  const addWorker = (workerData: Omit<WorkerItem, 'id' | 'employeeCode'>) => {
    const newId = 'w-' + Date.now();
    const employeeCode = `EMP-LF-${Math.floor(200 + Math.random() * 800)}`;
    const newWorker: WorkerItem = {
      id: newId,
      employeeCode,
      ...workerData
    };
    setWorkers(prev => [newWorker, ...prev]);
    showToast('Worker Enrolled', `${workerData.name} enrolled in ${workerData.department} (${workerData.skillGrade})`);
  };

  const updateWorker = (updatedWorker: WorkerItem) => {
    setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
    showToast('Worker Profile Updated', `${updatedWorker.name} dossier updated successfully.`);
  };

  const deleteWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
    showToast('Worker Separated', `Worker record archived and final dues calculated.`);
  };

  const recordClockIn = (employeeCode: string, name: string, department: string, shift: string) => {
    const newId = 'att-' + Date.now();
    const now = new Date();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${mins} ${ampm}`;
    const isLate = hours > 6 || (hours === 6 && now.getMinutes() > 15);

    const newEntry: AttendanceEntry = {
      id: newId,
      employeeCode,
      name,
      department,
      shift,
      clockIn: formattedTime,
      biometricGate: 'Gate #1 Main Turnstile',
      status: isLate ? 'Late' : 'On Time'
    };

    setAttendance(prev => [newEntry, ...prev]);
    showToast('Biometric Punch Recorded', `${name} clocked in at ${formattedTime} (${isLate ? 'Late punch logged' : 'On Time'})`);
  };

  const addChallan = (challanData: Omit<DeliveryChallan, 'id' | 'challanNumber' | 'gatePassTime'>) => {
    const newId = 'ch-' + Date.now();
    const challanNum = `DC-LF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newChallan: DeliveryChallan = {
      id: newId,
      challanNumber: challanNum,
      gatePassTime: now,
      ...challanData
    };

    setChallans(prev => [newChallan, ...prev]);
    showToast('Gate Pass & Challan Issued', `${challanNum} for ${challanData.clientName} loaded on vehicle ${challanData.vehicleNumber}`);
  };

  const markChallanDelivered = (id: string) => {
    setChallans(prev => prev.map(c => c.id === id ? { ...c, status: 'Delivered & Signed' } : c));
    showToast('Proof of Delivery (POD) Signed', 'Delivery verified by customer store receiver');
  };

  const addInvoice = (invoiceData: Omit<InvoiceItem, 'id' | 'invoiceNumber' | 'salesTaxPKR' | 'whtPKR' | 'netPayablePKR' | 'issueDate'>) => {
    const newId = 'inv-' + Date.now();
    const invoiceNum = `INV-LF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const salesTax = Math.round(invoiceData.subtotalPKR * 0.18); // 18% Sales Tax
    const wht = Math.round(invoiceData.subtotalPKR * 0.01); // 1% Withholding Tax
    const netPayable = invoiceData.subtotalPKR + salesTax;
    const today = new Date().toISOString().split('T')[0];

    const newInvoice: InvoiceItem = {
      id: newId,
      invoiceNumber: invoiceNum,
      salesTaxPKR: salesTax,
      whtPKR: wht,
      netPayablePKR: netPayable,
      issueDate: today,
      ...invoiceData
    };

    setInvoices(prev => [newInvoice, ...prev]);
    showToast('Sales Tax Invoice Created', `${invoiceNum} generated for ${invoiceData.clientName} (Total: PKR ${netPayable.toLocaleString()})`);
  };

  const markInvoicePaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv));
    showToast('Payment Realized', 'Bank remittance voucher verified and reconciled in ledger');
  };

  return (
    <MillDataContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        clients,
        addClient,
        lots,
        addLot,
        advanceLotStage,
        inventory,
        addStockItem,
        qcAudits,
        addQCAudit,
        workers,
        addWorker,
        updateWorker,
        deleteWorker,
        attendance,
        recordClockIn,
        challans,
        addChallan,
        markChallanDelivered,
        invoices,
        addInvoice,
        markInvoicePaid,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </MillDataContext.Provider>
  );
};

export const useMillData = () => {
  const context = useContext(MillDataContext);
  if (!context) {
    throw new Error('useMillData must be used within a MillDataProvider');
  }
  return context;
};
