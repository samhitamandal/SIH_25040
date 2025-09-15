import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard_test';
import Sidebar from './components/Sidebar';
import './styles.css';

function App() {
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [clickedLat, setClickedLat] = useState(null);
  const [clickedLng, setClickedLng] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [isLoadingTraj, setIsLoadingTraj] = useState(false);

  const handleMapClick = (lat, lng) => {
    setClickedLat(lat);
    setClickedLng(lng);
    setDashboardVisible(true);
  };

  const handleCloseDashboard = () => {
    setDashboardVisible(false);
    setClickedLat(null);
    setClickedLng(null);
  };

  const handleTrajectoriesLoaded = (data) => {
    setTrajectories(data || []);
  };

  const normalizeId = (id) => {
    let cleaned = id.trim();
    if (cleaned.toLowerCase().startsWith('np.int64(') && cleaned.endsWith(')')) {
      cleaned = cleaned.slice(9, -1);
    }
    cleaned = cleaned.replace(/[^0-9]/g, '');
    return cleaned;
  };

  const fetchTrajectories = async (inputIds) => {
    const ids = inputIds.map(normalizeId).filter(Boolean);
    if (ids.length === 0) return;
    setIsLoadingTraj(true);
    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('argo_ids', id));
      const url = `http://127.0.0.1:8080/api/trajectories?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to fetch trajectories');
      }
      const data = await res.json();
      setTrajectories(data.trajectories || []);
    } catch (e) {
      console.error(e);
      setTrajectories([]);
    } finally {
      setIsLoadingTraj(false);
    }
  };

  return (
    <div className="App">
      <Sidebar onPlot={fetchTrajectories} isLoading={isLoadingTraj} />
      <MapComponent 
        onMapClick={handleMapClick}
        clickedLat={clickedLat}
        clickedLng={clickedLng}
        trajectories={trajectories}
      />
      {dashboardVisible && (
        <Dashboard
          onClose={handleCloseDashboard}
          latitude={clickedLat}
          longitude={clickedLng}
        />
      )}
    </div>
  );
}

export default App;