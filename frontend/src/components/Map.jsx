import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const createMarker = (status) => L.divIcon({
  className: '',
  html: `<div class="map-marker map-marker-${status.toLowerCase()}"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const MapView = ({ units = [] }) => {
  return (
    <div className="map-container">
      <MapContainer 
        center={[16.5062, 80.6480]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {units.map(amb => (
          <Marker 
            key={amb.id} 
            position={[amb.location.lat, amb.location.lon]}
            icon={createMarker(amb.status)}
          >
            <Popup>
              <strong>{amb.id}</strong><br/>
              Status: {amb.status}<br/>
              {amb.status === 'BUSY' && (
                <>
                  Speed: {amb.speed} km/h<br/>
                  → {amb.hospital}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
