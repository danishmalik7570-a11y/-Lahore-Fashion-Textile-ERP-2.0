import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { useMillData } from '../../context/MillDataContext';
import { DeliveryView } from '../../components/DeliveryView';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  PackageCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Plus,
  ArrowUpRight,
  MapPin
} from 'lucide-react';

export const DeliveryWorkspaceView: React.FC = () => {
  const { challans, markChallanDelivered, lots } = useMillData();
  const { user } = useAuth();
  const delNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'delivery')!;
  const [activeTab, setActiveTab] = useState('del-overview');
  const [activeSubPage, setActiveSubPage] = useState<string | undefined>();

  // Computed metrics
  const inTransitCount = challans.filter(c => c.status === 'In Transit' || c.status === 'Gate Pass Issued').length;
  const deliveredCount = challans.filter(c => c.status === 'Delivered & Signed').length;
  const readyLots = lots.filter(l => l.stageCode === 'PACKING' || l.stageCode === 'DISPATCH' || l.stageCode === 'GREY_INSPECT');
  const otifPercent = challans.length > 0 ? Math.round((deliveredCount / Math.max(challans.length, 1)) * 96) : 98;
  const activeTransporters = Array.from(new Set(challans.map(c => c.driverName).filter(Boolean))).length || 4;

  const quickActions: QuickActionItem[] = [
    {
      id: 'new-challan',
      label: '+ New Delivery Challan',
      primary: true,
      onClick: () => setActiveTab('del-challans')
    },
    {
      id: 'view-staged',
      label: 'Staged Lots',
      onClick: () => setActiveTab('del-ready')
    }
  ];

  return (
    <ModuleWorkspace
      moduleKey="delivery"
      moduleTitle="Delivery"
      moduleSubtitle="Challans, Gate Passes & Order Shipments"
      moduleIconName="Truck"
      tabs={delNav.tabs}
      activeTabId={activeTab}
      onTabChange={(tabId, subId) => {
        setActiveTab(tabId);
        setActiveSubPage(subId);
      }}
      activeSubPageId={activeSubPage}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Delivery OS', delNav.tabs.find((t) => t.id === activeTab)?.label || 'Overview']}
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'del-overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 5 KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Ready to Ship</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageCheck size={18} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{readyLots.length * 12 + 18} Rolls</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpRight size={14} /> 4 orders staged in warehouse
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>In Transit</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={18} color="#d97706" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{inTransitCount || 2} Dispatches</div>
              <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                Gate passes issued & en-route
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Delivered (This Month)</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{deliveredCount || 14} Challans</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Total 84,200 meters delivered
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>OTIF Rate</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{otifPercent}%</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                On-time & in-full target: 95%
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Active Transporters</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{activeTransporters} Fleets</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Operating from Lahore Mill gate
              </div>
            </div>
          </div>

          {/* DISPATCH ACTION BAR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Recent Dispatches & Outward Gate Passes</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Live delivery feed for Lahore Fashion Mill main dispatch terminal</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setActiveTab('del-ready')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                View Staged Lots
              </button>
              <button
                onClick={() => setActiveTab('del-challans')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={16} /> New Delivery Challan
              </button>
            </div>
          </div>

          {/* RECENT DISPATCHES TABLE */}
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Challan #</th>
                  <th style={{ padding: '12px 16px' }}>Client & Destination</th>
                  <th style={{ padding: '12px 16px' }}>Order Reference</th>
                  <th style={{ padding: '12px 16px' }}>Vehicle / Driver</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Rolls / Metres</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <Truck size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                      No delivery challans issued yet for Lahore Fashion Mill.
                      <div style={{ marginTop: 12 }}>
                        <button
                          onClick={() => setActiveTab('del-challans')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          + Issue First Delivery Challan
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  challans.slice(0, 8).map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>
                        {c.challanNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{c.clientName}</div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {c.destinationCity}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {c.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{c.vehicleNumber}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.driverName} ({c.driverPhone})</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.totalRolls} rolls</span>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.totalMetres.toLocaleString()} m</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: c.status === 'Delivered & Signed' ? '#dcfce7' : c.status === 'In Transit' ? '#fef3c7' : '#e0e7ff',
                            color: c.status === 'Delivered & Signed' ? '#166534' : c.status === 'In Transit' ? '#92400e' : '#3730a3'
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => window.print()}
                            title="Print Format Builder Slip"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              cursor: 'pointer',
                              color: '#475569'
                            }}
                          >
                            <Printer size={14} />
                          </button>
                          {c.status !== 'Delivered & Signed' && (
                            <button
                              onClick={() => markChallanDelivered(c.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 4,
                                border: 'none',
                                background: '#16a34a',
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm POD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. READY TO SHIP */}
      {activeTab === 'del-ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Staged Rolls & Ready Inventory</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Finished fabric lots inspected, packed, and approved by QC for dispatch</p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Lot #</th>
                  <th style={{ padding: '12px 16px' }}>Order Number</th>
                  <th style={{ padding: '12px 16px' }}>Fabric Spec</th>
                  <th style={{ padding: '12px 16px' }}>Stage</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Staged Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {readyLots.map((lot) => (
                  <tr key={lot.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{lot.lotNumber}</td>
                    <td style={{ padding: '12px 16px', color: '#2563eb' }}>{lot.orderNumber}</td>
                    <td style={{ padding: '12px 16px' }}>{lot.fabricSpec}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 600 }}>
                        {lot.stageName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                      {lot.producedMetres.toLocaleString()} m
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setActiveTab('del-challans')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 4,
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Create Gate Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CHALLANS TAB - EMBEDDED DELIVERYVIEW */}
      {activeTab === 'del-challans' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <DeliveryView />
        </div>
      )}

      {/* 4. GATE PASSES TAB */}
      {activeTab === 'del-gate-passes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Lahore Fashion Mill Gate Passes</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Security gate pass log for Returnable, Non-Returnable, and Material Outward</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                Print Gate Register
              </button>
              <button
                onClick={() => setActiveTab('del-challans')}
                style={{ padding: '6px 14px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
              >
                + New Gate Pass
              </button>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {challans.map((c) => (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>GP-OUT-2026</span>
                      <h4 style={{ margin: '2px 0 0', fontSize: 15, color: '#0f172a' }}>{c.challanNumber}</h4>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 10, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600 }}>
                      Non-Returnable
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><strong>Vehicle:</strong> {c.vehicleNumber}</div>
                    <div><strong>Driver:</strong> {c.driverName} ({c.driverPhone})</div>
                    <div><strong>Destination:</strong> {c.destinationCity}</div>
                    <div><strong>Materials:</strong> {c.totalRolls} rolls ({c.totalMetres.toLocaleString()} m)</div>
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Verified at Main Gate</span>
                    <button
                      onClick={() => window.print()}
                      style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Printer size={13} /> Print GP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TRANSPORTERS & VEHICLES */}
      {activeTab === 'del-transporters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Registered Transporters & Logistics Vendors</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Verified logistics contractors servicing Lahore Fashion Mill outward freight</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { name: 'National Goods Transport Co.', contact: 'Haji Aslam', phone: '+92 300 8472911', fleet: '12 Mazda Trucks', rating: '4.8/5' },
              { name: 'Lahore Multan Cargo Service', contact: 'Tariq Mehmood', phone: '+92 321 4419200', fleet: '8 Containers', rating: '4.9/5' },
              { name: 'Fast Track Logistics Punjab', contact: 'Rana Zahid', phone: '+92 333 4812399', fleet: '6 Flatbeds', rating: '4.7/5' }
            ].map((t, idx) => (
              <div key={idx} style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>{t.name}</h4>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 10 }}>{t.rating}</span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><strong>Lead Contact:</strong> {t.contact}</div>
                  <div><strong>Phone:</strong> {t.phone}</div>
                  <div><strong>Registered Fleet:</strong> {t.fleet}</div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
                    Rate Card
                  </button>
                  <button style={{ padding: '5px 12px', borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>
                    Assign Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TRACKING & POD */}
      {activeTab === 'del-tracking' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Tracking & Proof of Delivery (POD)</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Digital signature and receiver stamped delivery challans for completed shipments</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challans.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.challanNumber} — {c.clientName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Destination: {c.destinationCity} | Vehicle: {c.vehicleNumber}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.status === 'Delivered & Signed' ? '#16a34a' : '#d97706' }}>
                    {c.status === 'Delivered & Signed' ? 'POD Received & Stamped' : 'In Transit / Pending POD'}
                  </span>
                  <button
                    onClick={() => alert(`Viewing signed POD image for ${c.challanNumber}`)}
                    style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 12, cursor: 'pointer' }}
                  >
                    View POD Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. RETURNS & CLAIMS */}
      {activeTab === 'del-returns' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 30, textAlign: 'center' }}>
          <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#0f172a' }}>No Open Transit Returns or Claims</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>All dispatches for Lahore Fashion Mill have been cleared without shortage claims.</p>
        </div>
      )}

      {/* 8. REPORTS */}
      {activeTab === 'del-reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Delivery & Logistics Analytics</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Dispatch performance, monthly freight expenses, and OTIF compliance</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Avg Turnaround Time (Gate-In to Gate-Out)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>42 Minutes</div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Freight Spend (Current Month)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 485,000</div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Claims & Shortage %</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>0.04%</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              style={{ padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: '#ffffff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={16} /> Print Monthly Delivery Report
            </button>
          </div>
        </div>
      )}
    </ModuleWorkspace>
  );
};
