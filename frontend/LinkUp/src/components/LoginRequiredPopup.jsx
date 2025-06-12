import React from 'react';
import '../style/LoginRequiredPopup.css';

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