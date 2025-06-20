import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import '../style/AuthModal.css';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from './ToastContext';

/**
 * AuthModal component for user authentication including login and registration.
 * Handles both email/password and Google OAuth authentication methods.
 * Creates or updates user profiles in Firestore upon successful authentication.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @returns {JSX.Element|null} The rendered authentication modal or null if not open
 */
function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    /**
     * Handles Google OAuth authentication using Firebase Auth.
     * Creates or updates user profile in Firestore with default values.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleGoogleSignIn = async () => {
        try {
            setError('');
            const result = await signInWithPopup(auth, googleProvider);
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: new Date().toISOString(),
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
                endorsementCount: 0,
                reputation: 1000
            }, { merge: true });
            onClose();
            showToast('Logged in successfully!', 'success');
        } catch (error) {
            setError(error.message);
        }
    };

    /**
     * Handles email/password authentication for both login and registration.
     * Validates required fields and creates user profile for new registrations.
     * 
     * @async
     * @param {Event} e - The form submit event
     * @returns {Promise<void>}
     */
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                onClose();
                showToast('Logged in successfully!', 'success');
            } else {
                if (!nickname) {
                    setError('Nickname is required');
                    return;
                }
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', result.user.uid), {
                    email: email,
                    nickname: nickname,
                    createdAt: new Date().toISOString(),
                    photoBase64: '/User.jpg',
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
                    endorsementCount: 0,
                    reputation: 1000
                });
                onClose();
                showToast('Account created successfully!', 'success');
            }
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
                            <label htmlFor="nickname"><h4>Nickname</h4></label>
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
                        <label htmlFor="email"><h4>Email</h4></label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label htmlFor="password"><h4>Password</h4></label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            className="show-password-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            style={{
                              position: "absolute",
                              right: "1.2rem",
                              top: "0.5rem",
                              height: '100%',
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: '#7B68EE',
                              fontWeight: 600,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 2
                            }}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    <button type="submit" className="ButtonCustom3">
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