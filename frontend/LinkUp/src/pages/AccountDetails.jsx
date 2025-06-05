import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import '../style/AccountDetails.css';
import { Github, Linkedin, Globe, Dribbble } from 'lucide-react';
import { Helmet } from 'react-helmet';
import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <link
          rel="preload"
          as="video"
          href="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae"
        />
      </Helmet>
      <div className="account-details-container">
        <video autoPlay loop muted playsInline src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae" alt="wave" />
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="account-details-content profile-redesign">
          <div className="profile-center-block">
            <div className="profile-avatar-outer">
              <img 
                src={profile.photoBase64 || '/User.png'} 
                alt={profile.nickname || 'Profile'} 
                className="profile-avatar-img"
              />
            </div>
            <h1 className="profile-nickname">{profile.nickname || 'Anonymous User'}</h1>
            {isCurrentUser && (
              <button 
                className="edit-profile-button main"
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </button>
            )}
          </div>
          <div className="profile-info-cards">
            <div className="profile-info-card">
              <h2>About me</h2>
              <p>{profile.bio || 'No bio yet.'}</p>
            </div>
            <div className="profile-info-card">
              <h2>Specialisation</h2>
              <p>{profile.specialisation || 'Not specified'}</p>
            </div>
          </div>
          <div className="profile-social-card">
            <h2>Social Links</h2>
            <div className="profile-social-links">
              {profile.socialLinks?.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="profile-social-link github"><Github size={20}/> <span>{profile.socialLinks.github.replace('https://github.com/', '')}</span></a>
              )}
              {profile.socialLinks?.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="profile-social-link linkedin"><Linkedin size={20}/> <span>{profile.socialLinks.linkedin.replace('https://www.linkedin.com/in/', '')}</span></a>
              )}
              {profile.socialLinks?.behance && (
                <a href={profile.socialLinks.behance} target="_blank" rel="noopener noreferrer" className="profile-social-link behance"><Globe size={20}/> <span>{profile.socialLinks.behance.replace('https://www.behance.net/', '')}</span></a>
              )}
              {profile.socialLinks?.dribbble && (
                <a href={profile.socialLinks.dribbble} target="_blank" rel="noopener noreferrer" className="profile-social-link dribbble"><Dribbble size={20}/> <span>{profile.socialLinks.dribbble.replace('https://dribbble.com/', '')}</span></a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AccountDetails; 