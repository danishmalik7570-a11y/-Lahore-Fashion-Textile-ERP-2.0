import React, { useState } from 'react';
import { useMillData } from '../context/MillDataContext';
import { 
  Truck, 
  Plus, 
  Search, 
  CheckCircle2, 
  MapPin, 
  X,
  Printer,
  Scale
} from 'lucide-react';

export const DeliveryView: React.FC = () => {
  const { challans, addChallan, markChallanDelivered, orders } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWeighbridgeModalOpen, setIsWeighbridgeModalOpen] = useState(false);
  const [selectedChallanForPass, setSelectedChallanForPass] = useState<any>(null);

  // Form State
  const [orderNumber, setOrderNumber] = useState(orders[0]?.orderNumber || 'PO-LF-2026-8837');
  const [clientName, setClientName] = useState(orders[0]?.clientName || 'Nishat Linen');
  const [destinationCity, setDestinationCity] = useState('Lahore (Nishat Mills Emporium)');
  const [vehicleNumber, setVehicleNumber] = useState('LES-26-8812');
  const [driverName, setDriverName] = useState('Rafiq Gujjar');
  const [driverPhone, setDriverPhone] = useState('+92 300 4829102');
  const [totalRolls, setTotalRolls] = useState<number>(64);
  const [totalMetres, setTotalMetres] = useState<number>(31800);

  // Weighbridge State
  const [weighTruck, setWeighTruck] = useState('LES-26-8812');
  const [grossWeightKg, setGrossWeightKg] = useState<number>(18450);
  const [tareWeightKg, setTareWeightKg] = useState<number>(8200);
  const netWeightKg = grossWeightKg - tareWeightKg;

  const filteredChallans = challans.filter(c => 
    c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !clientName || !vehicleNumber || !driverName) {
      alert('Please fill all gate pass details.');
      return;
    }

    addChallan({
      orderNumber,
      clientName,
      destinationCity,
      vehicleNumber,
      driverName,
      driverPhone,
      totalRolls: Number(totalRolls),
      totalMetres: Number(totalMetres),
      status: 'Gate Pass Issued'
    });

    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Truck size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Delivery Challans & Security Gate Passes
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Mill exit security clearances, dispatch container logistics & Proof of Delivery (POD) confirmations
          </p>
        </div>

        {/* Industrial Dispatch Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Export Dispatch Manifest</span>
          </button>

          <button 
            onClick={() => setIsWeighbridgeModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--blue-primary)' }}
          >
            <Scale size={15} />
            <span>Weighbridge & Seal Check</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Issue Delivery Gate Pass</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>CHALLANS ISSUED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {challans.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Consignments</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● Security gate scanned
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL METRES DISPATCHED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            {(challans.reduce((sum, c) => sum + c.totalMetres, 0) / 1000).toFixed(1)}k <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Metres</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Loaded on bonded carrier trucks
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>VEHICLES IN TRANSIT</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--gold)' }}>
            {challans.filter(c => c.status === 'In Transit').length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>En Route</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            GPS tracking active on national highway
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SIGNED POD RATE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            100%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            0 delivery discrepancy or shortages
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by challan #, client, vehicle #, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Challans Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>CHALLAN NUMBER</th>
              <th style={{ padding: '12px 14px' }}>BUYER & ORDER</th>
              <th style={{ padding: '12px 14px' }}>DESTINATION</th>
              <th style={{ padding: '12px 14px' }}>VEHICLE & DRIVER</th>
              <th style={{ padding: '12px 14px' }}>CONSIGNMENT SIZE</th>
              <th style={{ padding: '12px 14px' }}>GATE PASS TIME</th>
              <th style={{ padding: '12px 14px' }}>STATUS</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallans.map((c) => (
              <tr 
                key={c.id}
                style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                  {c.challanNumber}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.clientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.orderNumber}</div>
                </td>
                <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="var(--rose)" />
                    <span>{c.destinationCity}</span>
                  </div>
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600 }}>{c.vehicleNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.driverName} ({c.driverPhone})</div>
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 700 }}>{c.totalMetres.toLocaleString()} m</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.totalRolls} Packed Rolls</div>
                </td>
                <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {c.gatePassTime}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className={c.status === 'Delivered & Signed' ? 'badge badge-emerald' : c.status === 'In Transit' ? 'badge badge-gold' : 'badge badge-blue'}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {c.status !== 'Delivered & Signed' ? (
                      <button
                        onClick={() => markChallanDelivered(c.id)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={13} color="var(--emerald)" />
                        <span>Sign POD</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
                        ✓ POD
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedChallanForPass(c)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Print Official Mill Gate Pass"
                    >
                      <Printer size={13} color="var(--blue-primary)" />
                      <span>Pass</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Weighbridge & Seal Verification Modal */}
      {isWeighbridgeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWeighbridgeModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} color="var(--blue-primary)" />
                <span>Mill Weighbridge & Security Seal Terminal</span>
              </h3>
              <button onClick={() => setIsWeighbridgeModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Truck Vehicle Number *</label>
                <input type="text" className="input-field" value={weighTruck} onChange={(e) => setWeighTruck(e.target.value)} />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="label">Gross Weight (Loaded kg)</label>
                  <input type="number" className="input-field" value={grossWeightKg} onChange={(e) => setGrossWeightKg(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Tare Weight (Empty kg)</label>
                  <input type="number" className="input-field" value={tareWeightKg} onChange={(e) => setTareWeightKg(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ background: 'var(--blue-light)', border: '1px solid #bfdbfe', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NET FABRIC CONSIGNMENT WEIGHT:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
                  {netWeightKg.toLocaleString()} kg
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '4px' }}>
                  ✓ Security Seal Verified: #LF-SEAL-98442
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsWeighbridgeModalOpen(false)} className="btn btn-secondary">Close</button>
                <button type="button" onClick={() => { alert(`Weighbridge slip of ${netWeightKg} kg authorized. Security turnstile open.`); setIsWeighbridgeModalOpen(false); }} className="btn btn-primary">
                  Authorize Exit Turnstile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Mill Exit Gate Pass Print Modal */}
      {selectedChallanForPass && (
        <div className="modal-overlay" onClick={() => setSelectedChallanForPass(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '540px', padding: '26px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid var(--border-medium)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Official Factory Exit Gate Pass</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Security Gate Clearance Voucher</span>
              </div>
              <button onClick={() => setSelectedChallanForPass(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '18px', background: '#ffffff', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--blue-primary)' }}>{selectedChallanForPass.challanNumber}</span>
                <span className="badge badge-emerald">{selectedChallanForPass.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Order Reference:</span> <strong>{selectedChallanForPass.orderNumber}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Buyer Brand:</span> <strong>{selectedChallanForPass.clientName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Destination:</span> <strong>{selectedChallanForPass.destinationCity}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Carrier Vehicle:</span> <strong>{selectedChallanForPass.vehicleNumber}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Driver / Contact:</span> <strong>{selectedChallanForPass.driverName} ({selectedChallanForPass.driverPhone})</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Consignment:</span> <strong>{selectedChallanForPass.totalMetres.toLocaleString()}m ({selectedChallanForPass.totalRolls} Rolls)</strong></div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setSelectedChallanForPass(null)} className="btn btn-secondary">Close</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Exit Gate Pass (3 Copies)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
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
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={20} color="var(--blue-primary)" />
                  <span>Issue Delivery Challan & Gate Pass</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Authorize factory exit security clearance for finished fabric dispatch
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Select Order (PO) *</label>
                <select 
                  className="input-field"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    const sel = orders.find(o => o.orderNumber === e.target.value);
                    if (sel) {
                      setClientName(sel.clientName);
                      setTotalMetres(sel.quantityMetres);
                      setTotalRolls(Math.round(sel.quantityMetres / 500));
                    }
                  }}
                  required
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber}>{o.orderNumber} - {o.clientName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Buyer / Client</label>
                  <input type="text" className="input-field" value={clientName} readOnly />
                </div>

                <div>
                  <label className="label">Destination Warehouse / Mill *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Vehicle / Truck Plate # *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. LES-26-4091"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Driver Full Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Rafiq Gujjar"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Driver Mobile #</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Total Rolls *</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field" 
                    value={totalRolls}
                    onChange={(e) => setTotalRolls(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Total Metres *</label>
                  <input 
                    type="number" 
                    min="100" 
                    className="input-field" 
                    value={totalMetres}
                    onChange={(e) => setTotalMetres(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Issue Gate Pass & Print Security Barcode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
