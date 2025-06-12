import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { X, User } from 'lucide-react';
import '../style/SpecializationPopup.css';

/**
 * SpecializationPopup component for displaying users by their specialization.
 * Fetches and displays a list of users who have specified a particular specialization.
 * Allows navigation to user profiles and handles loading/error states.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is currently open
 * @param {Function} props.onClose - Callback function to close the popup
 * @param {string} props.specialization - The specialization to filter users by
 * @returns {JSX.Element|null} The rendered popup component or null if not open
 */
function SpecializationPopup({ isOpen, onClose, specialization }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    /**
     * Fetches users when the popup opens or specialization changes.
     */
    useEffect(() => {
        if (isOpen && specialization) {
            fetchUsersBySpecialization();
        }
    }, [isOpen, specialization]);

    /**
     * Fetches users from Firestore filtered by the specified specialization.
     * Updates the users state with the fetched data and handles loading/error states.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const fetchUsersBySpecialization = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('specialisation', '==', specialization));
            const querySnapshot = await getDocs(q);
            
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Navigates to a user's profile page and closes the popup.
     * 
     * @param {string} userId - The ID of the user to navigate to
     */
    const handleUserClick = (userId) => {
        navigate(`/account/${userId}`);
        onClose();
    };

    /**
     * Handles backdrop click to close the popup when clicking outside the modal.
     * 
     * @param {Event} e - The click event
     */
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="specialization-popup-overlay" onClick={handleBackdropClick}>
            <div className="specialization-popup">
                <div className="popup-header">
                    <h2>{specialization} Professionals</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                
                <div className="popup-content">
                    {loading ? (
                        <div className="loading">Loading professionals...</div>
                    ) : error ? (
                        <div className="error">{error}</div>
                    ) : users.length === 0 ? (
                        <div className="no-users">
                            <p>No professionals found for {specialization}</p>
                            <p>Be the first to set this as your specialization!</p>
                        </div>
                    ) : (
                        <div className="users-grid">
                            {users.map((user) => (
                                <div 
                                    key={user.id} 
                                    className="user-card"
                                    onClick={() => handleUserClick(user.id)}
                                >
                                    <div className="user-card-left">
                                        <div className="user-avatar">
                                            {user.photoBase64 ? (
                                                <img 
                                                    src={user.photoBase64} 
                                                    alt={user.nickname || 'User'} 
                                                    className="user-image"
                                                />
                                            ) : (
                                                <div className="user-placeholder">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h3 className="user-name">
                                                {user.nickname || user.displayName || 'Anonymous User'}
                                            </h3>
                                            <p className="user-bio">
                                                {user.bio ? 
                                                    (user.bio.length > 100 ? 
                                                        `${user.bio.substring(0, 100)}...` : 
                                                        user.bio
                                                    ) : 
                                                    'No bio available'
                                                }
                                            </p>
                                            {user.specialisation && (
                                                <span className="user-specialization">
                                                    {user.specialisation}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="user-card-right">
                                        <p>Reputation</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SpecializationPopup; 