import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';
import '../style/Navigation.css';

/**
 * Navigation component for the main application header.
 * Handles user authentication state, profile management, and navigation links.
 * Displays user profile picture, notification bell, and authentication modal.
 * 
 * @returns {JSX.Element} The rendered navigation component
 */
function Navigation() {
    const [user, setUser] = useState(null);
    const [profilePic, setProfilePic] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Sets up authentication state listener and fetches user profile data.
     * Updates user state and profile picture when authentication changes.
     */
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

    /**
     * Closes dropdown when navigating to different pages.
     */
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [location.pathname]);

    /**
     * Handles clicks outside the dropdown to close it.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    /**
     * Handles user sign out by calling Firebase Auth and navigating to home page.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    /**
     * Navigates to the user's profile page.
     */
    const handleProfileClick = () => {
        navigate('/profile');
    };

    /**
     * Navigates to the user's trades page.
     */
    const handleMyTradesClick = () => {
        navigate('/my-trades');
    };

    /**
     * Toggles the profile dropdown menu visibility.
     */
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className="main-nav">
            <div className="nav-logo">
                <Link to="/"><img src="./Logo.png" alt="LinkUp Logo" /></Link>
            </div>
            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/swaps" className="nav-link">Swaps</Link>
                {user && (
                  <Link to="/messages" className="nav-link">Messages</Link>
                )}
            </div>
            <div className="auth-section">
                {user ? (
                    <div className="user-menu" ref={dropdownRef}>
                        <NotificationBell />
                        <button 
                            className="profile-button"
                            onClick={toggleDropdown}
                            title="Account Menu"
                        >
                            <img 
                                src={profilePic} 
                                alt="Profile" 
                                className="profile-picture"
                            />
                        </button>
                        {isDropdownOpen && (
                            <div className="profile-dropdown">
                                <button onClick={handleProfileClick}>Account Details</button>
                                <button onClick={handleMyTradesClick} >My Swaps</button>
                                <button onClick={handleSignOut} >Sign Out</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button 
                        className="ButtonCustom2"
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