import React from 'react';

const Analytics = ({ data }) => {
    if (!data) return null;

    const metrics = [
        { label: 'Total Emergencies', value: data.totalEvents, icon: '🚨' },
        { label: 'Active Events', value: data.active, icon: '⏳' },
        { label: 'Completed Events', value: data.completed, icon: '✅' },
        { label: 'Available Ambulances', value: data.availableAmbulances, icon: '🚑' },
    ];

    return (
        <div className="analytics-container">
            <div className="analytics-grid">
                <div className="analytics-card highlight">
                    <div className="card-icon">⏱️</div>
                    <div className="card-content">
                        <span className="card-label">Avg Response Time</span>
                        <h2 className="card-value">{data.averageResponseTime} min</h2>
                    </div>
                </div>
                {metrics.map((metric, index) => (
                    <div key={index} className="analytics-card">
                        <div className="card-icon">{metric.icon}</div>
                        <div className="card-content">
                            <span className="card-label">{metric.label}</span>
                            <h3 className="card-value">{metric.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .analytics-container {
                    margin-bottom: 25px;
                }
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                }
                .analytics-card {
                    background: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: transform 0.2s;
                }
                .analytics-card:hover {
                    transform: translateY(-2px);
                }
                .analytics-card.highlight {
                    background: #e74c3c;
                    color: #fff;
                    grid-column: span 1;
                }
                .analytics-card.highlight .card-label {
                    color: #ffc9c9;
                }
                .card-icon {
                    font-size: 2rem;
                }
                .card-content {
                    display: flex;
                    flex-direction: column;
                }
                .card-label {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .card-value {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .highlight .card-value {
                    font-size: 1.8rem;
                }
            `}</style>
        </div>
    );
};

export default Analytics;
