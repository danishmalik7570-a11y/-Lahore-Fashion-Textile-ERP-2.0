import React, { useState } from 'react';
import { useMillData } from '../context/MillDataContext';
import { 
  Settings, 
  Save, 
  Building, 
  Radio,
  Smartphone
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { showToast } = useMillData();

  // Settings State
  const [millName, setMillName] = useState('Lahore Fashion Textile Mills (Pvt) Ltd');
  const [headOfficeAddress, setHeadOfficeAddress] = useState('Plot 42-A, Sundar Industrial Estate, Raiwind Road, Lahore');
  const [ntn, setNtn] = useState('2849102-4');
  const [strn, setStrn] = useState('1700284910219');
  const [currency, setCurrency] = useState('PKR');
  const [salesTaxRate, setSalesTaxRate] = useState<number>(18);
  // WHT fixed at 1%
  const [activeLoomsCount, setActiveLoomsCount] = useState<number>(68);
  const [telemetryBrokerUrl, setTelemetryBrokerUrl] = useState('wss://mill-telemetry.lahorefashion.com/v1/sensors');
  const [whatsAppNotifications, setWhatsAppNotifications] = useState(true);
  const [whatsAppApiKey, setWhatsAppApiKey] = useState('wh_live_92300_lahore_fashion_production');
  const [twoFactorEnforce, setTwoFactorEnforce] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuration Saved', 'Mill enterprise parameters updated and applied across all branch terminals.');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Settings size={22} color="var(--blue-primary)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', margin: 0 }}>
              Mill Configuration & System Settings
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Enterprise taxation parameters, IoT loom telemetry sensor brokers, and security access controls
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Corporate Entity */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Building size={18} color="var(--blue-primary)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
              Corporate Registration & FBR Tax Profiles
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Registered Legal Name *</label>
              <input 
                type="text" 
                className="input-field" 
                value={millName}
                onChange={(e) => setMillName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Base Accounting Currency</label>
              <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar - Export Ledgers)</option>
                <option value="EUR">EUR (Euro - European Buyers)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Head Office & Mill Address</label>
            <input 
              type="text" 
              className="input-field" 
              value={headOfficeAddress}
              onChange={(e) => setHeadOfficeAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">FBR NTN Number</label>
              <input 
                type="text" 
                className="input-field" 
                value={ntn}
                onChange={(e) => setNtn(e.target.value)}
              />
            </div>

            <div>
              <label className="label">FBR Sales Tax STRN</label>
              <input 
                type="text" 
                className="input-field" 
                value={strn}
                onChange={(e) => setStrn(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Sales Tax Rate (%)</label>
              <input 
                type="number" 
                className="input-field" 
                value={salesTaxRate}
                onChange={(e) => setSalesTaxRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Section 2: IoT Telemetry & Looms */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Radio size={18} color="var(--emerald)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
              IoT Telemetry & Loom Sensor Integration
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Connected Air-Jet Looms & Knitting Machines</label>
              <input 
                type="number" 
                className="input-field" 
                value={activeLoomsCount}
                onChange={(e) => setActiveLoomsCount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="label">FastAPI Telemetry WebSocket Broker</label>
              <input 
                type="text" 
                className="input-field" 
                value={telemetryBrokerUrl}
                onChange={(e) => setTelemetryBrokerUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Alerts & 2FA */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Smartphone size={18} color="var(--blue-primary)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
              Automated WhatsApp Gate & Delivery Alerts
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>WhatsApp Gate Pass & POD Delivery Notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Send real-time dispatch alerts to buyers (Khaadi, Sapphire) with gate pass PDFs</div>
            </div>
            <input 
              type="checkbox" 
              checked={whatsAppNotifications}
              onChange={(e) => setWhatsAppNotifications(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--blue-primary)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label className="label">WhatsApp Business Cloud API Key</label>
            <input 
              type="password" 
              className="input-field" 
              value={whatsAppApiKey}
              onChange={(e) => setWhatsAppApiKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Enforce TOTP 2FA for Admin & Accountants</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requires Google Authenticator or Microsoft Authenticator on login</div>
            </div>
            <input 
              type="checkbox" 
              checked={twoFactorEnforce}
              onChange={(e) => setTwoFactorEnforce(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--blue-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem' }}
          >
            <Save size={18} />
            <span>Save Enterprise Configuration</span>
          </button>
        </div>
      </form>

    </div>
  );
};
