import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LoginRequired component for displaying login requirement messages.
 * Provides either a button with custom click handler or a link to login page.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onLoginClick - Optional callback function for login button click
 * @returns {JSX.Element} The rendered login requirement component
 */
const LoginRequired = ({ onLoginClick }) => (
  <div className="login-required-container">
    <h2>You must be logged in to use this feature.</h2>
    {onLoginClick ? (
      <button className="login-link" onClick={onLoginClick}>
        Log In
      </button>
    ) : (
      <Link to="/login" className="login-link">Go to Login</Link>
    )}
  </div>
);

export default LoginRequired; 