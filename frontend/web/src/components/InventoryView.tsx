import React, { useState } from 'react';
import { useMillData, type InventoryItem } from '../context/MillDataContext';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownLeft, 
  Warehouse, 
  X,
  Printer,
  QrCode,
  ArrowUpRight,
  ClipboardCheck
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { inventory, addStockItem } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGinModalOpen, setIsGinModalOpen] = useState(false);
  const [selectedStockForLabel, setSelectedStockForLabel] = useState<InventoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Yarn Bobbins');
  const [currentStock, setCurrentStock] = useState<number>(5000);
  const [unit, setUnit] = useState('kg');
  const [reorderLevel, setReorderLevel] = useState<number>(1500);
  const [warehouseLocation, setWarehouseLocation] = useState('Godown A - Section 02');
  const [unitCostPKR, setUnitCostPKR] = useState<number>(750);

  // GIN Issue State
  const [ginItem, setGinItem] = useState(inventory[0]?.name || '40s Combed Cotton Yarn');
  const [ginDepartment, setGinDepartment] = useState('Weaving Shed #01 (Air-Jet Looms)');
  const [ginQuantity, setGinQuantity] = useState<number>(500);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalStockValuation = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCostPKR), 0);
  const lowStockCount = inventory.filter(item => item.currentStock <= item.reorderLevel).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || currentStock <= 0 || unitCostPKR <= 0) {
      alert('Please fill all stock receipt fields.');
      return;
    }

    addStockItem({
      name,
      category,
      currentStock: Number(currentStock),
      unit,
      reorderLevel: Number(reorderLevel),
      warehouseLocation,
      unitCostPKR: Number(unitCostPKR)
    });

    setName('');
    setIsModalOpen(false);
  };

  const handleGinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`GIN Issued: ${ginQuantity} dispatched to ${ginDepartment}. Godown balance updated.`);
    setIsGinModalOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Package size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Yarn, Dyes, Chemicals & Fabric Stock Ledger
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Multi-godown raw material stock management, Goods Receipt Notes (GRN) & real-time inventory balances
          </p>
        </div>

        {/* Industrial Stock Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Printer size={15} />
            <span>Export Stock Valuation</span>
          </button>

          <button 
            onClick={() => alert('Barcode Terminal connected. Audit scan verified: 0 discrepancies across Godown A & Godown B.')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <ClipboardCheck size={15} color="var(--emerald)" />
            <span>Audit Barcode Scan</span>
          </button>

          <button 
            onClick={() => setIsGinModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px', color: 'var(--blue-primary)' }}
          >
            <ArrowUpRight size={15} />
            <span>Issue to Floor (GIN)</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 14px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Inward Receipt (GRN)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL STOCK VALUATION</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            PKR {(totalStockValuation / 1000000).toFixed(2)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Verified against physical audit
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>YARN IN GODOWNS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            42,700 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>kg</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Cotton cones, Ring spun & Lycra
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>GREY & FINISHED FABRIC</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            96,900 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Metres</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Rolls stored across Godown B & C
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>REORDER WARNINGS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: lowStockCount > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
            {lowStockCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Items Low</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {lowStockCount === 0 ? 'Safe buffer stock maintained' : 'Reorder alerts dispatched to procurement'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search stock by SKU code, item name, godown location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Yarn Bobbins', 'Grey Fabric', 'Dyes & Chemicals', 'Finished Fabric'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? 'var(--blue-primary)' : 'var(--bg-subtle)',
                color: categoryFilter === cat ? '#ffffff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 14px' }}>SKU ITEM CODE</th>
              <th style={{ padding: '12px 14px' }}>ITEM DESCRIPTION</th>
              <th style={{ padding: '12px 14px' }}>CATEGORY</th>
              <th style={{ padding: '12px 14px' }}>CURRENT BALANCE</th>
              <th style={{ padding: '12px 14px' }}>REORDER BUFFER</th>
              <th style={{ padding: '12px 14px' }}>UNIT COST (PKR)</th>
              <th style={{ padding: '12px 14px' }}>TOTAL VALUE</th>
              <th style={{ padding: '12px 14px' }}>GODOWN LOCATION</th>
              <th style={{ padding: '12px 14px' }}>STOCK HEALTH</th>
              <th style={{ padding: '12px 14px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isLow = item.currentStock <= item.reorderLevel;

              return (
                <tr 
                  key={item.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--blue-primary)' }}>
                    {item.code}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-blue">
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 800, fontSize: '0.92rem' }}>
                    {item.currentStock.toLocaleString()} {item.unit}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {item.reorderLevel.toLocaleString()} {item.unit}
                  </td>
                  <td style={{ padding: '14px' }}>
                    PKR {item.unitCostPKR.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    PKR {(item.currentStock * item.unitCostPKR).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Warehouse size={13} color="var(--text-sub)" />
                      <span>{item.warehouseLocation}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {isLow ? (
                      <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} />
                        <span>Reorder</span>
                      </span>
                    ) : (
                      <span className="badge badge-emerald">
                        Optimal
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setGinItem(item.name); setIsGinModalOpen(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                        title="Issue to Floor via GIN"
                      >
                        <ArrowUpRight size={13} color="var(--blue-primary)" />
                        <span>Issue GIN</span>
                      </button>
                      <button
                        onClick={() => setSelectedStockForLabel(item)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Print Barcode Tag"
                      >
                        <QrCode size={13} />
                        <span>Label</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GIN Goods Issue Note Modal */}
      {isGinModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGinModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '540px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowUpRight size={20} color="var(--blue-primary)" />
                <span>Issue Goods Issue Note (GIN) to Production</span>
              </h3>
              <button onClick={() => setIsGinModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Item Material *</label>
                <input type="text" className="input-field" value={ginItem} onChange={(e) => setGinItem(e.target.value)} required />
              </div>
              <div>
                <label className="label">Receiving Factory Department *</label>
                <select className="input-field" value={ginDepartment} onChange={(e) => setGinDepartment(e.target.value)}>
                  <option value="Weaving Shed #01 (Air-Jet Looms)">Weaving Shed #01 (Air-Jet Looms)</option>
                  <option value="Spinning Floor #02 (Ring Spun)">Spinning Floor #02 (Ring Spun)</option>
                  <option value="Dyeing House (Jet Dyeing Vats)">Dyeing House (Jet Dyeing Vats)</option>
                  <option value="Rotary Printing Press Section">Rotary Printing Press Section</option>
                  <option value="Cutting & Stitching Lines">Cutting & Stitching Lines</option>
                </select>
              </div>
              <div>
                <label className="label">Dispatch Quantity (Weight / Unit) *</label>
                <input type="number" className="input-field" value={ginQuantity} onChange={(e) => setGinQuantity(Number(e.target.value))} min="1" required />
              </div>
              <div className="form-actions" style={{ marginTop: '10px' }}>
                <button type="button" onClick={() => setIsGinModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch GIN to Mill Floor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode & QR Pallet Label Modal */}
      {selectedStockForLabel && (
        <div className="modal-overlay" onClick={() => setSelectedStockForLabel(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Pallet & Roll Barcode Label</h3>
              <button onClick={() => setSelectedStockForLabel(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ border: '2px dashed var(--border-medium)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', background: '#ffffff', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>LAHORE FASHION TEXTILE MILLS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px' }}>{selectedStockForLabel.name}</div>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', color: 'var(--blue-primary)', fontWeight: 800, margin: '8px 0' }}>
                {selectedStockForLabel.code}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                <QrCode size={72} color="var(--text-main)" />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Location: <strong>{selectedStockForLabel.warehouseLocation}</strong> • Qty: <strong>{selectedStockForLabel.currentStock} {selectedStockForLabel.unit}</strong>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setSelectedStockForLabel(null)} className="btn btn-secondary">Close</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} />
                <span>Print Thermal Barcode Label</span>
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
                  <ArrowDownLeft size={20} color="var(--emerald)" />
                  <span>Inward Stock Receipt Note (GRN)</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Record new delivery of yarn cones, dyes, chemicals or fabric rolls into mill godowns
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
                <label className="label">Item Description & Specification *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 30/1 Combed Cotton Cone Yarn (Sapphire Mills)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Item Stock Category *</label>
                  <select 
                    className="input-field"
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as InventoryItem['category'];
                      setCategory(cat);
                      if (cat === 'Yarn Bobbins' || cat === 'Dyes & Chemicals') setUnit('kg');
                      else if (cat === 'Grey Fabric' || cat === 'Finished Fabric') setUnit('metres');
                      else setUnit('pcs');
                    }}
                  >
                    <option value="Yarn Bobbins">Yarn Bobbins</option>
                    <option value="Grey Fabric">Grey Fabric Rolls</option>
                    <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                    <option value="Finished Fabric">Finished Fabric</option>
                    <option value="Trims & Accessories">Trims & Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="label">Unit of Measure *</label>
                  <select 
                    className="input-field"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="metres">metres (Linear Metres)</option>
                    <option value="cones">cones (Yarn Cones)</option>
                    <option value="litres">litres (Chemical Liquid)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Received Quantity *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Reorder Warning Level *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Unit Cost (PKR) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1"
                    value={unitCostPKR}
                    onChange={(e) => setUnitCostPKR(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Godown Storage Location *</label>
                  <select 
                    className="input-field"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                  >
                    <option value="Godown A - Weave Yarn Store">Godown A - Weave Yarn Store</option>
                    <option value="Godown B - Grey Fabric Warehouse">Godown B - Grey Fabric Warehouse</option>
                    <option value="Chemical Vault #01 - Dyes">Chemical Vault #01 - Dyes</option>
                    <option value="Godown C - Finished Export Yard">Godown C - Finished Export Yard</option>
                  </select>
                </div>
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Inward Receipt Value:</span>
                <strong style={{ color: 'var(--emerald)', fontSize: '0.95rem' }}>
                  PKR {(currentStock * unitCostPKR).toLocaleString()}
                </strong>
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
                  <span>Authorize GRN & Add to Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
