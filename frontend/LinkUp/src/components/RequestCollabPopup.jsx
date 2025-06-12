import React, { useState } from 'react';
import '../style/RequestCollabPopup.css';

function RequestCollabPopup({ isOpen, onClose, onSubmit, loading }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="request-collab-overlay" onClick={onClose}>
      <div className="request-collab-modal" onClick={e => e.stopPropagation()}>
        <h2>What do you want in return?</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            className="request-collab-textarea"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe what you want in return for your work..."
            rows={5}
            required
            disabled={loading}
          />
          <div className="request-collab-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestCollabPopup; 