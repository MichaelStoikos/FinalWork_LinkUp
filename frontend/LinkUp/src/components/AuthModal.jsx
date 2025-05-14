import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import '../style/AuthModal.css';

function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            const result = await signInWithPopup(auth, googleProvider);
            // Create or update user document in Firestore
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: new Date().toISOString(),
                // Add other fields with default values
                nickname: result.user.displayName,
                tags: [],
                availability: [],
                bio: '',
                socialLinks: {
                    github: '',
                    linkedin: '',
                    behance: '',
                    dribbble: ''
                },
                portfolio: [],
                endorsements: [],
                endorsementCount: 0
            }, { merge: true });
            onClose();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Register
                if (!nickname) {
                    setError('Nickname is required');
                    return;
                }
                const result = await createUserWithEmailAndPassword(auth, email, password);
                // Create user document in Firestore
                await setDoc(doc(db, 'users', result.user.uid), {
                    email: email,
                    nickname: nickname,
                    createdAt: new Date().toISOString(),
                    // Add other fields with default values
                    tags: [],
                    availability: [],
                    bio: '',
                    socialLinks: {
                        github: '',
                        linkedin: '',
                        behance: '',
                        dribbble: ''
                    },
                    portfolio: [],
                    endorsements: [],
                    endorsementCount: 0
                });
            }
            onClose();
        } catch (error) {
            setError(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="auth-modal">
                <button className="close-button" onClick={onClose}>&times;</button>
                
                <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
                
                {error && <p className="error-message">{error}</p>}
                
                <button 
                    className="google-auth-button"
                    onClick={handleGoogleSignIn}
                >
                    <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="google-icon"
                    />
                    Continue with Google
                </button>
                
                <div className="divider">
                    <span>or</span>
                </div>
                
                <form onSubmit={handleEmailAuth}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="nickname">Nickname</label>
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required={!isLogin}
                                placeholder="Choose a nickname"
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    <button type="submit" className="submit-button">
                        {isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>
                
                <p className="switch-auth-mode">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        className="switch-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Let's make one!" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default AuthModal; 