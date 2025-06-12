import React from 'react';
import '../style/LoginRequiredPopup.css';

/**
 * LoginRequiredPopup component for prompting users to log in.
 * Displays a modal that requires user authentication to access certain features.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is currently open
 * @param {Function} props.onClose - Callback function to close the popup
 * @param {Function} props.onLogin - Callback function to trigger login action
 * @returns {JSX.Element|null} The rendered popup component or null if not open
 */
function LoginRequiredPopup({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;
  return (
    <div className="login-required-overlay" onClick={onClose}>
      <div className="login-required-content" onClick={e => e.stopPropagation()}>
        <p className="login-required-message">
          <b>You must be logged in to use this feature.</b>
        </p>
        <button className="login-required-btn" onClick={onLogin}>Log In</button>
      </div>
    </div>
  );
}

export default LoginRequiredPopup; 