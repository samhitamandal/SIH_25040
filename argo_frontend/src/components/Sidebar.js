import React, { useState } from 'react';

const Sidebar = ({ onPlot, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [ids, setIds] = useState('');
  const [error, setError] = useState(null);

  const toggle = () => setIsOpen(!isOpen);

  const handlePlot = () => {
    const parsed = ids.split(',').map(s => s.trim()).filter(Boolean);
    if (parsed.length === 0) {
      setError('Please enter at least one Argo ID');
      return;
    }
    setError(null);
    onPlot(parsed);
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <div style={{
        width: isOpen ? 300 : 44,
        transition: 'width 0.2s ease',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 10, borderBottom: '1px solid #eee' }}>
          <button onClick={toggle} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>
            {isOpen ? '⟨' : '⟩'}
          </button>
          {isOpen && <h3 style={{ margin: '0 0 0 8px', fontSize: 16 }}>Argo Trajectories</h3>}
        </div>
        {isOpen && (
          <div style={{ padding: 12 }}>
            <label style={{ fontSize: 12, color: '#555' }}>Enter comma-separated Argo IDs</label>
            <input
              value={ids}
              onChange={e => setIds(e.target.value)}
              placeholder="e.g. 6903059, 6903060"
              style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
            />
            {error && <div style={{ color: 'red', marginTop: 6, fontSize: 12 }}>{error}</div>}
            <button onClick={handlePlot} disabled={isLoading} style={{ marginTop: 10, width: '100%', padding: 10, background: '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {isLoading ? 'Loading…' : 'Plot'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;


