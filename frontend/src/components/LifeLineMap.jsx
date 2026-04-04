import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

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

const incidentIcon = L.divIcon({
    html: '🚨',
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Routing Component
const Routing = ({ from, to }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !from || !to) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(from[0], from[1]),
                L.latLng(to[0], to[1])
            ],
            lineOptions: {
                styles: [{ color: '#e74c3c', weight: 4, opacity: 0.8 }]
            },
            createMarker: () => null, // We already have our markers
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false // Hide text instructions for clean UI
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, from, to]);

    return null;
};

// Helper component to auto-recenter the map
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 13, { animate: true });
    }, [center, map]);
    return null;
};

const LifeLineMap = ({ incidentLoc, ambulanceLoc }) => {
    // Default coordinates if none provided
    const incidentPos = incidentLoc || [40.7128, -74.0060]; // NYC
    const ambulancePos = ambulanceLoc || [40.7306, -73.9352];

    return (
        <div className="lifeline-map-container">
            <MapContainer 
                center={incidentPos} 
                zoom={13} 
                style={{ height: '350px', width: '100%', borderRadius: '12px' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <RecenterMap center={incidentPos} />

                {/* Routing Machine */}
                {ambulanceLoc && incidentLoc && (
                    <Routing from={ambulancePos} to={incidentPos} />
                )}

                {/* Incident Location */}
                <Marker position={incidentPos} icon={incidentIcon}>
                    <Popup><b>Emergency Incident</b><br/>Location: {incidentPos.join(', ')}</Popup>
                </Marker>

                {/* Ambulance Location */}
                <Marker position={ambulancePos} icon={ambulanceIcon}>
                    <Popup><b>Ambulance En Route</b><br/>Status: Assigned</Popup>
                </Marker>
            </MapContainer>

            <style jsx global>{`
                .custom-div-icon {
                    background: none;
                    border: none;
                    font-size: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                .lifeline-map-container {
                    margin-bottom: 25px;
                    border: 1px solid #eee;
                    border-radius: 12px;
                    overflow: hidden;
                }
                /* Hide Routing Machine control panel */
                .leaflet-routing-container {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default LifeLineMap;
