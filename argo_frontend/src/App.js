import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard2';
import './styles.css';
import ChatbotInterface from './components/ChatbotInterface';

function App() {
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [clickedLat, setClickedLat] = useState(null);
  const [clickedLng, setClickedLng] = useState(null);

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

  return (
    <div className="App">
      <ChatbotInterface />
      {/* <MapComponent 
        onMapClick={handleMapClick}
        clickedLat={clickedLat}
        clickedLng={clickedLng}
      />
      {dashboardVisible && (
        <Dashboard
          onClose={handleCloseDashboard}
          latitude={clickedLat}
          longitude={clickedLng}
        />
      )} */}
    </div>
  );
}

export default App;