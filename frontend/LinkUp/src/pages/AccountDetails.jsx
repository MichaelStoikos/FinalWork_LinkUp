import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import '../style/AccountDetails.css';

function AccountDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Profile not found');
        }

        const profileData = docSnap.data();
        setProfile(profileData);
        
        // Check if this is the current user's profile
        if (auth.currentUser && auth.currentUser.uid === userId) {
          setIsCurrentUser(true);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="error-message">Profile not found</div>;

  return (
    <div className="account-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="account-details-content">
        <div className="account-header">
          <div className="profile-picture-container">
            <img 
              src={profile.photoBase64 || '/User.png'} 
              alt={profile.nickname || 'Profile'} 
              className="profile-picture"
            />
          </div>
          <div className="profile-header-info">
            <h1>{profile.nickname || 'Anonymous User'}</h1>
            {isCurrentUser && (
              <button 
                className="edit-profile-button"
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="account-details-grid">
          {profile.bio && (
            <div className="account-section">
              <h2>About</h2>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div className="account-section">
              <h2>Skills & Interests</h2>
              <div className="profile-tags">
                {profile.tags.map((tag, idx) => (
                  <span key={idx} className="profile-tag-chip">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {profile.availability && profile.availability.length > 0 && (
            <div className="account-section">
              <h2>Availability</h2>
              <div className="availability-list">
                {profile.availability.map((item, idx) => (
                  <span key={idx} className="availability-item">{item}</span>
                ))}
              </div>
            </div>
          )}

          {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
            <div className="account-section">
              <h2>Social Links</h2>
              <div className="social-links">
                {profile.socialLinks.github && (
                  <a 
                    href={profile.socialLinks.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link github"
                  >
                    GitHub
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a 
                    href={profile.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link linkedin"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.socialLinks.behance && (
                  <a 
                    href={profile.socialLinks.behance} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link behance"
                  >
                    Behance
                  </a>
                )}
                {profile.socialLinks.dribbble && (
                  <a 
                    href={profile.socialLinks.dribbble} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link dribbble"
                  >
                    Dribbble
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountDetails; 