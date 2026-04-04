import React from 'react';

const MatchResults = ({ matches }) => {
    if (!matches || matches.length === 0) {
        return <div className="no-matches">No potential matches found yet.</div>;
    }

    return (
        <div className="match-results-container">
            <h3>Top 3 Potential Matches</h3>
            <div className="match-cards">
                {matches.map((match, index) => (
                    <div key={index} className="match-card">
                        <div className="match-score">
                            <span>Score: {match.score}</span>
                        </div>
                        <div className="match-info">
                            <h4>{match.item.name}</h4>
                            <p><strong>Location:</strong> {match.item.location}</p>
                            <p>{match.item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .match-results-container {
                    margin-top: 20px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                }
                .match-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 10px;
                }
                .match-card {
                    padding: 15px;
                    border: 1px solid #eee;
                    border-radius: 6px;
                    background-color: #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .match-score {
                    font-size: 0.85rem;
                    color: #2e7d32;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                h4 { margin: 0 0 8px 0; color: #333; }
                p { margin: 4px 0; font-size: 0.9rem; color: #666; }
            `}</style>
        </div>
    );
};

export default MatchResults;
