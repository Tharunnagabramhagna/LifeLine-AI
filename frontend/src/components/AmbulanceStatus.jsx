import React from 'react';

const AmbulanceStatus = ({ ambulances }) => {
    return (
        <div className="ambulance-fleet">
            <h3>🚑 Fleet Status</h3>
            <div className="fleet-grid">
                {ambulances.map(amb => (
                    <div key={amb.id} className={`ambulance-item ${amb.status.toLowerCase()}`}>
                        <div className="amb-id">#{amb.id}</div>
                        <div className="amb-info">
                            <p className="amb-location">{amb.location}</p>
                            <span className={`amb-badge ${amb.status.toLowerCase()}`}>{amb.status}</span>
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .ambulance-fleet {
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                h3 { margin-bottom: 20px; color: #2c3e50; }
                .fleet-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                }
                .ambulance-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border: 1px solid #ecf0f1;
                    border-radius: 8px;
                    transition: transform 0.2s ease;
                }
                .ambulance-item:hover { transform: translateY(-2px); }
                .amb-id {
                    background: #f1f2f6;
                    color: #34495e;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-weight: bold;
                    font-size: 0.8rem;
                }
                .amb-info p { margin: 0; font-size: 0.85rem; color: #333; font-weight: 500; }
                .amb-badge {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .amb-badge.idle { background: #d1f2eb; color: #1abc9c; }
                .amb-badge.en_route { background: #fef5e7; color: #f39c12; }
                .amb-badge.busy { background: #fadbd8; color: #e74c3c; }
            `}</style>
        </div>
    );
};

export default AmbulanceStatus;
