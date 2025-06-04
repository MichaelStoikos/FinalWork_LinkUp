import React from 'react';
import { Link } from 'react-router-dom';

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