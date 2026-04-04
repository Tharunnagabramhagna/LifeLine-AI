import React, { useState } from 'react';
import MatchResults from './components/MatchResults';

const ItemSubmission = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmitItem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Simulated form data for lost item submission
        const itemData = {
            user_id: 1, // Logged-in user ID
            name: e.target.itemName.value,
            description: e.target.itemDesc.value,
            location: e.target.itemLocation.value,
            image: '' // Optional image URL
        };

        try {
            // 1. Submit the lost item to backend
            const response = await fetch('http://localhost:5000/api/lost-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });

            if (!response.ok) throw new Error('Failed to post lost item');
            
            const newItem = await response.json();
            const itemId = newItem.id;

            // 2. Fetch matches for the newly created item
            const matchResponse = await fetch(`http://localhost:5000/api/match-items?id=${itemId}&type=lost`);
            if (!matchResponse.ok) throw new Error('Failed to fetch matches');
            
            const matchResults = await matchResponse.json();
            setMatches(matchResults); // Results include top 3 matches with scores

        } catch (err) {
            console.error('Submission error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="submission-container">
            <h2>Post a Lost Item</h2>
            <form onSubmit={handleSubmitItem} className="submission-form">
                <input type="text" name="itemName" placeholder="Item Name (e.g., iPhone 13)" required />
                <textarea name="itemDesc" placeholder="Description (e.g., Black case, cracked screen)" required />
                <input type="text" name="itemLocation" placeholder="Location (e.g., Central Park)" required />
                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Post Item & Find Matches'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {/* Display Match Results after successful submission */}
            {matches.length > 0 && <MatchResults matches={matches} />}

            <style jsx>{`
                .submission-container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .submission-form { display: flex; flex-direction: column; gap: 15px; }
                input, textarea { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
                textarea { min-height: 100px; }
                button { padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                button:disabled { background-color: #ccc; }
                .error-message { color: red; margin-top: 10px; }
            `}</style>
        </div>
    );
};

export default ItemSubmission;
