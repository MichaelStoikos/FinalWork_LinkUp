import React, { useState } from 'react';
import '../style/RequestCollabPopup.css';

/**
 * RequestCollabPopup component for submitting collaboration requests.
 * Allows users to specify what they want in return for their work in a trade.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is currently open
 * @param {Function} props.onClose - Callback function to close the popup
 * @param {Function} props.onSubmit - Callback function called with the message on submission
 * @param {boolean} props.loading - Whether the form is in a loading state
 * @returns {JSX.Element|null} The rendered popup component or null if not open
 */
function RequestCollabPopup({ isOpen, onClose, onSubmit, loading }) {
  const [message, setMessage] = useState('');

  /**
   * Handles form submission by validating the message and calling the onSubmit callback.
   * Resets the message state after successful submission.
   * 
   * @param {Event} e - The form submit event
   */
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