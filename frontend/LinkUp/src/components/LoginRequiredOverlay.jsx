import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import LoginRequired from './LoginRequired';
import AuthModal from './AuthModal';
import '../style/LoginRequiredOverlay.css';

function LoginRequiredOverlay({ onClose }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Ensure portal root exists
    let portalRoot = document.getElementById('login-required-portal');
    if (!portalRoot) {
        portalRoot = document.createElement('div');
        portalRoot.id = 'login-required-portal';
        document.body.appendChild(portalRoot);
    }

    const modalContent = (
        <>
            <div className="login-required-overlay">
                <div className="login-required-content">
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <LoginRequired 
                        onLoginClick={() => {
                            setIsAuthModalOpen(true);
                        }} 
                    />
                </div>
            </div>
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
        </>
    );

    return createPortal(modalContent, portalRoot);
}

export default LoginRequiredOverlay; 