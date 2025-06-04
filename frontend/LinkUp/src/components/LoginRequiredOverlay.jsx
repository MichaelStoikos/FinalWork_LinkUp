import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginRequired from './LoginRequired';
import AuthModal from './AuthModal';
import '../style/LoginRequiredOverlay.css';

function LoginRequiredOverlay({ onClose }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <>
            <div className="login-required-overlay">
                <div className="login-required-content">
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <LoginRequired 
                        onLoginClick={() => {
                            setIsAuthModalOpen(true);
                            if (onClose) onClose();
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
}

export default LoginRequiredOverlay; 