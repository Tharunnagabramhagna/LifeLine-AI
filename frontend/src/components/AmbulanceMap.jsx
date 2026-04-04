import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const ambulanceIcon = L.divIcon({
    html: '🚑',
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const hospitalIcon = L.divIcon({
    html: '🏥',
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const AmbulanceMap = ({ incidentLoc, ambulanceLoc }) => {
    // Default to a central city location if coordinates aren't provided
    const incidentPos = incidentLoc || [40.7128, -74.0060]; // New York
    const ambulancePos = ambulanceLoc || [40.7306, -73.9352];

    return (
        <div className="map-wrapper">
            <MapContainer 
                center={incidentPos} 
                zoom={13} 
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Incident Location */}
                <Marker position={incidentPos} icon={hospitalIcon}>
                    <Popup>🚨 Emergency Incident Location</Popup>
                </Marker>

                {/* Ambulance Location */}
                <Marker position={ambulancePos} icon={ambulanceIcon}>
                    <Popup>🚑 Ambulance - En Route</Popup>
                </Marker>

                {/* Simulated Route Line */}
                <Polyline 
                    positions={[ambulancePos, incidentPos]} 
                    color="red" 
                    dashArray="10, 10" 
                    weight={3} 
                />
            </MapContainer>

            <style jsx global>{`
                .custom-div-icon {
                    background: none;
                    border: none;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .map-wrapper {
                    margin-top: 15px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default AmbulanceMap;
