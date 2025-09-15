import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import 'react-datepicker/dist/react-datepicker.css'; // We're not using DatePicker in this version yet

// A custom, visually pleasing color palette
const colorPalette = {
  temperature: '#E55451', // A rich red
  salinity: '#5D8AA8',     // A calm blue
};

const Dashboard = ({ data, isLoading, error, onClose, latitude, longitude }) => {
  // State to track the selected graph from the dropdown
  const [selectedGraph, setSelectedGraph] = useState('surface_temperature');

  const getPlotDataAndLayout = () => {
    let plotData = [];
    let layout = { title: 'Oceanographic Data', height: 400, autosize: true, margin: { l: 60, r: 60, b: 60, t: 80 } };

    const graphType = selectedGraph.split('_')[0]; // e.g., 'surface' or 'depth'
    const variable = selectedGraph.split('_')[1]; // e.g., 'temperature' or 'salinity'

    if (graphType === 'surface' && data.surface) {
      const name = variable === 'temperature' ? 'Temperature (°C)' : 'Salinity (PSU)';
      plotData = [{
        x: data.surface.profiles.map(p => p.time),
        y: data.surface.profiles.map(p => p.avg_temperature),
        mode: 'lines+markers',
        name: name,
        marker: { color: colorPalette[variable], size: 6 },
        line: { color: colorPalette[variable], width: 2 },
      }];
      layout.title = `Surface ${name} vs. Time`;
      layout.xaxis = { title: 'Date' };
      layout.yaxis = { title: name };
    } 
    
    else if (graphType === 'depth' && data.depthProfile) {
      const name = variable === 'temperature' ? 'Temperature (°C)' : 'Salinity (PSU)';
      // For depth profiles, the variable is on the x-axis and depth on the y-axis
      plotData = [{
        x: data.depthProfile.profiles.map(p => p.avg_temperature),
        y: data.depthProfile.profiles.map(p => p.depth),
        mode: 'lines+markers',
        name: name,
        marker: { color: colorPalette[variable], size: 6 },
        line: { color: colorPalette[variable], width: 2 },
      }];
      layout.title = `Time-Averaged ${name} vs. Depth`;
      layout.xaxis = { title: name };
      layout.yaxis = { title: 'Depth (m)', autorange: 'reversed' }; // Reversed so 0 is at the top
    }

    return { plotData, layout };
  };

  const { plotData, layout } = getPlotDataAndLayout();

  return (
    <div className="dashboard-container">
      <button className="dashboard-close-btn" onClick={onClose}>
        &times;
      </button>

      <h2>Oceanographic Dashboard</h2>

      <div className="dashboard-section">
        <h3>Metadata for Clicked Location</h3>
        <p><strong>Latitude:</strong> {latitude.toFixed(4)}°</p>
        <p><strong>Longitude:</strong> {longitude.toFixed(4)}°</p>
      </div>
      
      <div className="dashboard-section">
        <h3>Select Graph</h3>
        <select onChange={e => setSelectedGraph(e.target.value)} value={selectedGraph}>
          <optgroup label="Surface Data vs. Time">
            <option value="surface_temperature">Surface Temperature</option>
            <option value="surface_salinity">Surface Salinity</option>
          </optgroup>
          <optgroup label="Profile Data vs. Depth (5-Year Avg)">
            <option value="depth_temperature">Temperature Profile</option>
            <option value="depth_salinity">Salinity Profile</option>
          </optgroup>
          <optgroup label="Data at Specific Depth vs. Time">
            <option value="depth_series_temp_10">Temperature @ 10m</option>
            <option value="depth_series_temp_50">Temperature @ 50m</option>
            <option value="depth_series_salt_10">Salinity @ 10m</option>
            <option value="depth_series_salt_50">Salinity @ 50m</option>
          </optgroup>
        </select>

        {isLoading && <p>Loading data...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && plotData.length > 0 ? (
          <Plot data={plotData} layout={layout} />
        ) : (
          !isLoading && !error && <p>No data available to display.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;