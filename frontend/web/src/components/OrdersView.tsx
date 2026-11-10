import React, { useState } from 'react';
import { useMillData, type OrderItem } from '../context/MillDataContext';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  X,
  Calculator,
  Printer
} from 'lucide-react';
import { PrintButton } from './printing/PrintButton';

export const OrdersView: React.FC = () => {
  const { orders, addOrder, updateOrderStatus, clients } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [selectedOrderForSpec, setSelectedOrderForSpec] = useState<OrderItem | null>(null);

  // Form State
  const [clientName, setClientName] = useState(clients[0]?.name || 'Khaadi Apparel');
  const [fabricSpec, setFabricSpec] = useState('Lawn Printed Kurti 80/80');
  const [construction, setConstruction] = useState('80x80 / 100x90 40s Cotton');
  const [quantityMetres, setQuantityMetres] = useState<number>(20000);
  const [ratePerMetre, setRatePerMetre] = useState<number>(290);
  const [deliveryDate, setDeliveryDate] = useState('2026-11-25');
  const [branchCode, setBranchCode] = useState('LHR');
  const [remarks, setRemarks] = useState('Export quality mercerized');

  // BOM Calculator state
  const [bomLengthM, setBomLengthM] = useState<number>(20000);
  const [warpCount, setWarpCount] = useState<number>(40);
  const [weftCount, setWeftCount] = useState<number>(40);
  const [epi, setEpi] = useState<number>(100);
  const [ppi, setPpi] = useState<number>(90);
  const [widthInches, setWidthInches] = useState<number>(63);

  // Approximate Textile Engineering Formulas for Yarn Requirement in Bags (100 lbs / 45.36 kg per bag)
  const warpWeightLbs = Math.round((bomLengthM * 1.0936 * (epi * widthInches)) / (840 * warpCount));
  const weftWeightLbs = Math.round((bomLengthM * 1.0936 * (ppi * widthInches)) / (840 * weftCount));
  const totalYarnBags = Math.ceil((warpWeightLbs + weftWeightLbs) / 100);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.fabricSpec.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMetresBooked = orders.reduce((sum, o) => sum + o.quantityMetres, 0);
  const totalValuePKR = orders.reduce((sum, o) => sum + o.totalAmountPKR, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !fabricSpec || quantityMetres <= 0 || ratePerMetre <= 0) {
      alert('Please fill all required fields with valid values');
      return;
    }

    addOrder({
      clientName,
      fabricSpec,
      construction,
      quantityMetres: Number(quantityMetres),
      ratePerMetre: Number(ratePerMetre),
      deliveryDate,
      branchCode,
      status: 'Confirmed',
      remarks
    });

    setIsModalOpen(false);
  };

  const getStatusBadgeClass = (status: OrderItem['status']) => {
    switch (status) {
      case 'Confirmed': return 'badge badge-blue';
      case 'Weaving': return 'badge badge-cyan';
      case 'Dyeing': return 'badge badge-purple';
      case 'Printing': return 'badge badge-indigo';
      case 'Packing': return 'badge badge-gold';
      case 'Dispatched': return 'badge badge-emerald';
      case 'Delivered': return 'badge badge-emerald';
      default: return 'badge badge-gray';
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileSpreadsheet size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Buyer Purchase Orders & Fabric Specs
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Commercial booking master, warp/weft constructions, pricing matrices & production routing
          </p>
        </div>

        {/* Industrial Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Export Orders Master</span>
          </button>

          <button 
            onClick={() => setIsBomModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--blue-primary)' }}
          >
            <Calculator size={15} />
            <span>Calculate Yarn BOM</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Book New Buyer Order</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACTIVE ORDERS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {orders.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Contracts</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● 100% On-time manufacturing quota
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FABRIC VOLUME BOOKED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            {(totalMetresBooked / 1000).toFixed(1)}k <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Metres</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Across Lahore Fashion Mill production lines
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>GROSS CONTRACT VALUE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            PKR {(totalValuePKR / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ↑ 14.8% vs last fiscal quarter
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAJOR BUYERS ACTIVE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {new Set(orders.map(o => o.clientName)).size} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Key Brands</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Khaadi, Sapphire, J., Gul Ahmed
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by PO #, buyer, or fabric specification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Confirmed', 'Weaving', 'Dyeing', 'Printing', 'Packing', 'Dispatched'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? 'var(--blue-primary)' : 'var(--bg-subtle)',
                color: statusFilter === status ? '#ffffff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>PO NUMBER</th>
              <th style={{ padding: '12px 14px' }}>BUYER / BRAND</th>
              <th style={{ padding: '12px 14px' }}>FABRIC SPEC & CONSTRUCTION</th>
              <th style={{ padding: '12px 14px' }}>ORDER METRES</th>
              <th style={{ padding: '12px 14px' }}>RATE / METRE</th>
              <th style={{ padding: '12px 14px' }}>TOTAL VALUE (PKR)</th>
              <th style={{ padding: '12px 14px' }}>DELIVERY DATE</th>
              <th style={{ padding: '12px 14px' }}>STATUS</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr 
                  key={ord.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                    {ord.orderNumber}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {ord.clientName}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ord.fabricSpec}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.construction}</div>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600 }}>
                    {ord.quantityMetres.toLocaleString()} m
                  </td>
                  <td style={{ padding: '14px' }}>
                    PKR {ord.ratePerMetre}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--emerald)' }}>
                    PKR {ord.totalAmountPKR.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {ord.deliveryDate}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className={getStatusBadgeClass(ord.status)}>
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderItem['status'])}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Weaving">Weaving</option>
                        <option value="Dyeing">Dyeing</option>
                        <option value="Printing">Printing</option>
                        <option value="Packing">Packing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                      <button
                        onClick={() => setSelectedOrderForSpec(ord)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                        title="View Technical Fabric BOM Sheet"
                      >
                        BOM Spec
                      </button>
                      <PrintButton
                        docType="ORDER_CONFIRMATION"
                        docId={ord.orderNumber}
                        docTitle={`Order Confirmation ${ord.orderNumber}`}
                        buttonLabel="Print"
                        variant="outline"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Yarn BOM / Consumption Calculator Modal */}
      {isBomModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBomModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={20} color="var(--blue-primary)" />
                  <span>Textile Yarn BOM & Consumption Calculator</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Standard Engineering Warp & Weft Yarn Bag Requirement (100 lbs/bag)
                </span>
              </div>
              <button onClick={() => setIsBomModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="label">Order Length (m)</label>
                <input type="number" className="input-field" value={bomLengthM} onChange={(e) => setBomLengthM(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Warp Yarn Count (Ne)</label>
                <input type="number" className="input-field" value={warpCount} onChange={(e) => setWarpCount(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Weft Yarn Count (Ne)</label>
                <input type="number" className="input-field" value={weftCount} onChange={(e) => setWeftCount(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label className="label">Ends / Inch (EPI)</label>
                <input type="number" className="input-field" value={epi} onChange={(e) => setEpi(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Picks / Inch (PPI)</label>
                <input type="number" className="input-field" value={ppi} onChange={(e) => setPpi(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Reed Width (Inches)</label>
                <input type="number" className="input-field" value={widthInches} onChange={(e) => setWidthInches(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ background: 'var(--blue-light)', border: '1px solid #bfdbfe', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-dark)', marginBottom: '6px' }}>
                CALCULATED YARN INDENT REQUIREMENT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Warp Yarn:</span> <strong>{warpWeightLbs.toLocaleString()} lbs</strong> ({Math.ceil(warpWeightLbs / 100)} Bags)</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Weft Yarn:</span> <strong>{weftWeightLbs.toLocaleString()} lbs</strong> ({Math.ceil(weftWeightLbs / 100)} Bags)</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Yarn:</span> <strong style={{ color: 'var(--blue-primary)', fontSize: '1rem' }}>{totalYarnBags} Bags</strong></div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsBomModalOpen(false)} className="btn btn-secondary">Close Calculator</button>
              <button type="button" onClick={() => { alert(`Yarn Indent of ${totalYarnBags} bags generated for Yarn Godown.`); setIsBomModalOpen(false); }} className="btn btn-primary">
                Issue Yarn Purchase Indent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Fabric Spec Card Modal */}
      {selectedOrderForSpec && (
        <div className="modal-overlay" onClick={() => setSelectedOrderForSpec(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '580px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '2px solid var(--border-medium)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>
                  Technical Fabric Specification Sheet
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lahore Fashion Textile ERP • Weaving Loom Router
                </span>
              </div>
              <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <Printer size={15} />
                <span>Print Spec</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '0.88rem', marginBottom: '20px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Order Reference:</span> <strong>{selectedOrderForSpec.orderNumber}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Brand Buyer:</span> <strong>{selectedOrderForSpec.clientName}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Fabric Specification:</span> <strong>{selectedOrderForSpec.fabricSpec}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Warp & Weft Construction:</span> <strong>{selectedOrderForSpec.construction}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Booked Quantity:</span> <strong>{selectedOrderForSpec.quantityMetres.toLocaleString()} Metres</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Commercial Rate:</span> <strong>PKR {selectedOrderForSpec.ratePerMetre} / metre</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Committed Delivery:</span> <strong>{selectedOrderForSpec.deliveryDate}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Fulfillment Status:</span> <span className={getStatusBadgeClass(selectedOrderForSpec.status)}>{selectedOrderForSpec.status}</span></div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setSelectedOrderForSpec(null)} className="btn btn-secondary">Close Sheet</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Contract & Spec</span>
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
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Book New Buyer Order
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enter buyer fabric technical specifications, required yardage, and agreed pricing
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Buyer / Client Brand *</label>
                  <select 
                    className="input-field"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Production Branch *</label>
                  <select
                    className="input-field"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                  >
                    <option value="LHR">Lahore - Head Office & Weaving</option>
                    <option value="FSD">Faisalabad - Spinning & Greige</option>
                    <option value="KHI">Karachi - Export Apparel & Port</option>
                    <option value="MUL">Multan - Raw Cotton Ginning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Fabric Specification Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Lawn Printed Kurti 80/80 or Stretch Denim Twill 11.5oz"
                  value={fabricSpec}
                  onChange={(e) => setFabricSpec(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Technical Construction (Warp x Weft / Reed x Pick / Count)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 80x80 / 100x90 40s Combed Cotton"
                  value={construction}
                  onChange={(e) => setConstruction(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Quantity in Metres *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="500"
                    step="500"
                    value={quantityMetres}
                    onChange={(e) => setQuantityMetres(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Agreed Rate per Metre (PKR) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="10"
                    value={ratePerMetre}
                    onChange={(e) => setRatePerMetre(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Delivery Due Date *</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Calculated Contract Value</label>
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--blue-light)',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--blue-primary)',
                  }}>
                    PKR {(quantityMetres * ratePerMetre).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Special Instructions & Quality Specs</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="e.g. Reactive dyes only, AATCC color fastness grade 4, maximum 2% residual shrinkage"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
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
                  <span>Confirm & Issue Production PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
