import React from 'react';
import { MapContainer, TileLayer, useMapEvents, CircleMarker, Polyline } from 'react-leaflet'; // Add Polyline
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Add trajectories to props destructuring
const MapComponent = ({ onMapClick, clickedLat, clickedLng, trajectories }) => { 
  const mapCenter = [0, 0];
  const mapZoom = 4;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      className="leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* Conditionally render the blue dot */}
      {clickedLat && clickedLng && (
        <CircleMarker
          center={[clickedLat, clickedLng]}
          radius={5}
          fillColor="#007bff"
          color="#007bff"
          weight={1}
          opacity={1}
          fillOpacity={0.8}
        />
      )}

      {/* Draw trajectories as polylines */}
      {Array.isArray(trajectories) && trajectories.map((traj, idx) => {
        const positions = (traj.points || []).map(p => [p.latitude, p.longitude]);
        if (positions.length < 2) return null;
        const colorPalette = ['#ff5733', '#1f77b4', '#2ca02c', '#9467bd', '#8c564b', '#e377c2'];
        const color = colorPalette[idx % colorPalette.length];
        return (
          <Polyline key={`traj-${idx}`} positions={positions} color={color} weight={3} opacity={0.9} />
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;