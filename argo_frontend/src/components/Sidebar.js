import React, { useState } from 'react';

const Sidebar = ({ onPlot, isLoading, isOpen }) => { // Remove useState for isOpen
  const [ids, setIds] = useState('');
  const [error, setError] = useState(null);

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
    <div className="sidebar-container" style={{
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out',
    }}>
      <div className="sidebar-content">
        <h3 style={{ margin: '0 0 0 8px', fontSize: 16 }}>Argo Trajectories</h3>
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
      </div>
    </div>
  );
};

export default Sidebar;