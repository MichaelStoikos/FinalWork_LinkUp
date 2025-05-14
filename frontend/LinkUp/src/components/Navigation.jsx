import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import AuthModal from './AuthModal';
import '../style/Navigation.css';

function Navigation() {
    const [user, setUser] = useState(null);
    const [profilePic, setProfilePic] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                // Fetch Firestore user document for Base64 profile pic
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfilePic(data.photoBase64 || user.photoURL || '/User.png');
                } else {
                    setProfilePic(user.photoURL || '/User.png');
                }
            } else {
                setProfilePic('/User.png');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <nav className="main-nav">
            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/Trades">Trades</Link>
            </div>
            <div className="auth-section">
                {user ? (
                    <div className="user-menu">
                        <button 
                            className="profile-button"
                            onClick={handleProfileClick}
                            title="View Profile"
                        >
                            <img 
                                src={profilePic} 
                                alt="Profile" 
                                className="profile-picture"
                            />
                        </button>
                    </div>
                ) : (
                    <button 
                        className="login-button"
                        onClick={() => setIsAuthModalOpen(true)}
                    >
                        Login
                    </button>
                )}
            </div>
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
        </nav>
    );
}

export default Navigation;