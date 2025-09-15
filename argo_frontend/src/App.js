import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard_test';
import './styles.css';

function App() {
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [clickedLat, setClickedLat] = useState(null);
  const [clickedLng, setClickedLng] = useState(null);
  const [trajectories, setTrajectories] = useState([]);

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

  return (
    <div className="App">
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
          onTrajectoriesLoaded={handleTrajectoriesLoaded}
        />
      )}
    </div>
  );
}

export default App;