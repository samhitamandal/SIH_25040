import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import Plot from 'react-plotly.js';
import 'react-datepicker/dist/react-datepicker.css';

// A custom, visually pleasing color palette
const colorPalette = {
  temperature: '#E55451', // A rich red
  salinity: '#5D8AA8',     // A calm blue
  pressure: '#6A5ACD',    // A deep purple
};

const Dashboard = ({ data, onClose, latitude, longitude }) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  // States for the date pickers (updates on change)
  const [startDate, setStartDate] = useState(fiveYearsAgo);
  const [endDate, setEndDate] = useState(new Date());
  
  // States for the submitted dates (updates on button click)
  const [submittedStartDate, setSubmittedStartDate] = useState(fiveYearsAgo);
  const [submittedEndDate, setSubmittedEndDate] = useState(new Date());

  const [selectedGraph, setSelectedGraph] = useState('temperature');
  const [filteredProfiles, setFilteredProfiles] = useState([]);

  // Filter data based on the submitted date range
  useEffect(() => {
    if (data && data.profiles && submittedStartDate && submittedEndDate) {
      const filtered = data.profiles.filter((profile) => {
        const profileDate = new Date(profile.date);
        return profileDate >= submittedStartDate && profileDate <= submittedEndDate;
      });
      setFilteredProfiles(filtered);
    }
  }, [data, submittedStartDate, submittedEndDate]);

  // Function to handle the submit button click
  const handleSubmit = () => {
    setSubmittedStartDate(startDate);
    setSubmittedEndDate(endDate);
  };

  const getPlotData = () => {
    const plotDates = filteredProfiles.map((p) => p.date);
    let plotYData = [];
    let name = '';
    let color = '';
    let yaxisTitle = '';

    switch (selectedGraph) {
      case 'temperature':
        plotYData = filteredProfiles.map((p) => p.temperature);
        name = 'Temperature (°C)';
        color = colorPalette.temperature;
        yaxisTitle = 'Temperature (°C)';
        break;
      case 'salinity':
        plotYData = filteredProfiles.map((p) => p.salinity);
        name = 'Salinity (PSU)';
        color = colorPalette.salinity;
        yaxisTitle = 'Salinity (PSU)';
        break;
      case 'pressure':
        plotYData = filteredProfiles.map((p) => p.pressure);
        name = 'Pressure (dbar)';
        color = colorPalette.pressure;
        yaxisTitle = 'Pressure (dbar)';
        break;
      default:
        break;
    }

    return [{
      x: plotDates,
      y: plotYData,
      mode: 'lines+markers',
      name: name,
      marker: { color: color, size: 6 },
      line: { color: color, width: 2 },
    }];
  };

  const plotLayout = {
    title: {
      text: `Oceanographic Data (${selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)})`,
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: '#333'
      }
    },
    height: 500,
    width: 700,
    autosize: true,
    margin: { l: 60, r: 60, b: 60, t: 80 },
    xaxis: {
      title: 'Date',
      showgrid: false,
      zeroline: false,
      linecolor: '#ccc',
    },
    yaxis: {
        title: getPlotData()[0].name,
        showgrid: true,
        gridcolor: '#e6e6e6',
        zeroline: true,
        rangemode: 'tozero'
    },
    paper_bgcolor: '#f5f5f5',
    plot_bgcolor: '#ffffff',
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: "rgba(255, 255, 255, 0.8)",
      font: { color: "black" }
    },
    legend: {
      x: 0,
      y: 1.15,
      bgcolor: 'rgba(255, 255, 255, 0)',
      bordercolor: 'rgba(255, 255, 255, 0)'
    }
  };

  if (!data) return null;

  return (
    <div className="dashboard-container">
      <button className="dashboard-close-btn" onClick={onClose}>
        &times;
      </button>

      <h2>Oceanographic Dashboard</h2>

      {/* 1. Metadata Section */}
      <div className="dashboard-section">
        <h3>Metadata for Clicked Location</h3>
        <p>
          <strong>Latitude:</strong> {latitude.toFixed(4)}°
        </p>
        <p>
          <strong>Longitude:</strong> {longitude.toFixed(4)}°
        </p>
      </div>

      {/* 2. Date Range Selection */}
      <div className="dashboard-section date-range-selection">
        <h3>Select Date Range (5 Years Data)</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div>
            <label>From:</label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd-MM-yyyy"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>
          <div>
            <label>To:</label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd-MM-yyyy"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>
          <button onClick={handleSubmit} style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>Submit</button>
        </div>
      </div>

      {/* 3. Graph Selection & Plot */}
      <div className="dashboard-section">
        <h3>Select Graph</h3>
        <select onChange={e => setSelectedGraph(e.target.value)} value={selectedGraph}>
          <option value="temperature">Temperature</option>
          <option value="salinity">Salinity</option>
          <option value="pressure">Pressure</option>
        </select>
        {filteredProfiles.length > 0 ? (
          <Plot data={getPlotData()} layout={plotLayout} />
        ) : (
          <p>No data available for the selected date range. Please adjust your dates and click Submit.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;