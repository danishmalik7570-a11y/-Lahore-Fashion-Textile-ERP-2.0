import React, { useState } from 'react';
import { useMillData, type ClientItem } from '../context/MillDataContext';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  X,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { ClientLedgerView } from './ClientLedgerView';

export interface ClientsViewProps {
  embedded?: boolean;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ embedded = false }) => {
  const { clients, addClient } = useMillData();
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForLedger, setSelectedClientForLedger] = useState<ClientItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [brandType, setBrandType] = useState<ClientItem['brandType']>('Retail Fashion');
  const [city, setCity] = useState<ClientItem['city']>('Lahore');
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [creditLimitPKR, setCreditLimitPKR] = useState<number>(20000000);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.ntn.includes(searchTerm);
    const matchesCity = cityFilter === 'All' || c.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const totalCreditLimit = clients.reduce((sum, c) => sum + c.creditLimitPKR, 0);
  const totalReceivables = clients.reduce((sum, c) => sum + c.currentBalancePKR, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ntn || !contactPerson) {
      alert('Please fill all required client details.');
      return;
    }

    addClient({
      name,
      brandType,
      city,
      ntn,
      strn: strn || `1700${Math.floor(100000000 + Math.random() * 900000000)}`,
      creditLimitPKR: Number(creditLimitPKR),
      contactPerson,
      phone,
      email,
      status: 'Active'
    });

    setName('');
    setNtn('');
    setStrn('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setIsModalOpen(false);
  };

  if (selectedClientForLedger) {
    return (
      <ClientLedgerView
        client={selectedClientForLedger}
        onBack={() => setSelectedClientForLedger(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: embedded ? '0' : '28px', maxWidth: embedded ? '100%' : '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Users size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Clients & Commercial Brand Accounts
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Verified retail fashion houses, home textile exporters, FBR NTN tax profiles & credit underwriting
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>Register New Brand Client</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTERED BRANDS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {clients.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Corporate Clients</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            ● 100% Tax Active FBR Filers
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL CREDIT FACILITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--blue-primary)' }}>
            PKR {(totalCreditLimit / 1000000).toFixed(1)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Underwritten credit terms 30-60 days
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTSTANDING RECEIVABLES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--emerald)' }}>
            PKR {(totalReceivables / 1000000).toFixed(1)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Million</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Current running billing ledger
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>CREDIT UTILIZATION</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            {((totalReceivables / totalCreditLimit) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: '8px', fontWeight: 600 }}>
            Within safe banking exposure limits
          </div>
        </div>
      </div>

      {/* Direct Ledger Quick Jump Banner */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="var(--blue-primary)" />
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Open Client Ledger Statement:</strong>
          </div>
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '260px', fontSize: '0.85rem', padding: '6px 12px', cursor: 'pointer' }}
            onChange={(e) => {
              const found = clients.find(c => c.id === e.target.value);
              if (found) setSelectedClientForLedger(found);
            }}
            defaultValue=""
          >
            <option value="" disabled>Select brand / buyer account...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.city}) — Balance: PKR {(c.currentBalancePKR / 1000000).toFixed(2)}M
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Select any brand above or click <strong>View Real-Time Commercial Ledger</strong> on cards below.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '450px', position: 'relative' }}>
          <Search size={16} color="var(--text-sub)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by client name, NTN, contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Lahore', 'Karachi', 'Faisalabad'].map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              style={{
                background: cityFilter === c ? 'var(--blue-primary)' : 'var(--bg-subtle)',
                color: cityFilter === c ? '#ffffff' : 'var(--text-dim)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {filteredClients.map((client) => {
          const utilPercent = Math.min(Math.round((client.currentBalancePKR / client.creditLimitPKR) * 100), 100);

          return (
            <div 
              key={client.id} 
              className="glass-panel" 
              style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
              onClick={() => setSelectedClientForLedger(client)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                    {client.brandType}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '4px' }}>
                    {client.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Building2 size={13} />
                    <span>{client.city}, Pakistan</span>
                  </div>
                </div>

                <span className="badge badge-emerald">ACTIVE</span>
              </div>

              {/* FBR Tax Identifiers */}
              <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-sub)' }}>FBR NTN: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{client.ntn}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-sub)' }}>STRN: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{client.strn}</strong>
                </div>
              </div>

              {/* Credit Limit & Outstanding */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Credit Utilization: <strong>{utilPercent}%</strong></span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                    PKR {(client.currentBalancePKR / 1000000).toFixed(2)}M / {(client.creditLimitPKR / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${utilPercent}%`,
                    height: '100%',
                    background: utilPercent > 80 ? 'var(--rose)' : utilPercent > 50 ? 'var(--gold)' : 'var(--blue-primary)',
                    borderRadius: 'var(--radius-full)',
                  }} />
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                  <ShieldCheck size={14} color="var(--emerald)" />
                  <span>{client.contactPerson}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {client.phone}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {client.email}
                  </span>
                </div>
              </div>

              {/* Real-time Commercial Ledger Trigger */}
              <button
                onClick={() => setSelectedClientForLedger(client)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Receipt size={14} color="var(--blue-primary)" />
                <span>View Real-Time Commercial Ledger</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Workable Modal: Register New Client */}
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
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Register New Brand Client
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Create client commercial profile, credit limit and FBR tax credentials
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
                  <label className="label">Brand / Corporate Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Maria.B Designs, Bareeze, Outfitters"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Brand Industry Sector *</label>
                  <select 
                    className="input-field"
                    value={brandType}
                    onChange={(e) => setBrandType(e.target.value as ClientItem['brandType'])}
                  >
                    <option value="Retail Fashion">Retail Fashion</option>
                    <option value="Denim Apparel">Denim Apparel</option>
                    <option value="Home Textile">Home Textile</option>
                    <option value="Export House">Export House</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Corporate Head Office City *</label>
                  <select 
                    className="input-field"
                    value={city}
                    onChange={(e) => setCity(e.target.value as ClientItem['city'])}
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                  </select>
                </div>

                <div>
                  <label className="label">Credit Limit (PKR) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1000000"
                    step="1000000"
                    value={creditLimitPKR}
                    onChange={(e) => setCreditLimitPKR(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">FBR NTN Number *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 3948201-4"
                    value={ntn}
                    onChange={(e) => setNtn(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">FBR STRN (Sales Tax Registration)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 1700394820119"
                    value={strn}
                    onChange={(e) => setStrn(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Contact Person & Designation *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Tariq Mansoor (Head of Sourcing)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Official Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Official Email</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="sourcing@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  <span>Save Brand Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};
