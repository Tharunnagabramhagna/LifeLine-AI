import React from 'react';
import { apiRequest } from '../services/api';

const EventCard = ({ event, onComplete }) => {
    const statusColors = {
        'PENDING': '#f39c12',
        'ASSIGNED': '#3498db',
        'EN_ROUTE': '#e67e22',
        'COMPLETED': '#27ae60'
    };

    const handleFinishTrip = async () => {
        try {
            const data = await apiRequest(`/complete/${event.id}`, {
                method: 'POST'
            });
            if (data.success) {
                if (onComplete) onComplete(event.id);
            }
        } catch (error) {
            alert(error.message);
            console.error("Failed to finish trip:", error);
        }
    };

    return (
        <div className="event-card">
            <div className="event-header">
                <span className="event-type">{event.type.replace('_', ' ')}</span>
                <span className="event-status" style={{ backgroundColor: statusColors[event.status] || '#95a5a6' }}>
                    {event.status}
                </span>
            </div>
            <div className="event-body">
                <p><strong>📍 Location:</strong> {event.location}</p>
                <p><strong>🕒 Time:</strong> {new Date(event.timestamp).toLocaleString()}</p>
                {event.ambulance_id && (
                    <p className="assigned-info"><strong>🚑 Assigned:</strong> Ambulance #{event.ambulance_id}</p>
                )}
                {event.status !== 'COMPLETED' && (
                    <button className="finish-btn" onClick={handleFinishTrip}>
                        🏁 Finish Trip
                    </button>
                )}
            </div>
            <style jsx>{`
                .event-card {
                    background: #fff;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 5px solid #e74c3c;
                }
                .event-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .event-type {
                    font-weight: bold;
                    color: #2c3e50;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                }
                .event-status {
                    color: #fff;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                .event-body p {
                    margin: 5px 0;
                    font-size: 0.9rem;
                    color: #555;
                }
                .assigned-info {
                    color: #2980b9;
                    font-weight: 500;
                    margin-top: 10px !important;
                }
                .finish-btn {
                    margin-top: 12px;
                    width: 100%;
                    padding: 8px;
                    background: #2c3e50;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: background 0.2s;
                }
                .finish-btn:hover {
                    background: #34495e;
                }
            `}</style>
        </div>
    );
};

export default EventCard;
