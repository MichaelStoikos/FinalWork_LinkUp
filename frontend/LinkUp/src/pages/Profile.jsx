import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import '../style/Profile.css';
import { Github, Linkedin, Dribbble, Globe } from 'lucide-react';
import { Helmet } from 'react-helmet';
import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastContext';


function Profile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        nickname: '',
        bio: '',
        specialisation: '',
        tags: [],
        availability: [],
        socialLinks: {
            github: '',
            linkedin: '',
            behance: '',
            dribbble: ''
        }
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfile(data);
                        setFormData({
                            nickname: data.nickname || '',
                            bio: data.bio || '',
                            specialisation: data.specialisation || '',
                            tags: data.tags || [],
                            availability: data.availability || [],
                            socialLinks: data.socialLinks || {
                                github: '',
                                linkedin: '',
                                behance: '',
                                dribbble: ''
                            }
                        });
                    }
                } catch (err) {
                    setError('Error loading profile: ' + err.message);
                }
            } else {
                navigate('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleImageClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            setError(null);

            // Convert image to Base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                // Update the user document in Firestore
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    photoBase64: base64String
                });
                // Update local state
                setProfile(prev => ({
                    ...prev,
                    photoBase64: base64String || prev.photoBase64
                }));
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Error uploading image: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('social.')) {
            const platform = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [platform]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, formData);
            setProfile(prev => ({
                ...prev,
                ...formData,
                photoBase64: prev.photoBase64 // preserve the image!
            }));
            setIsEditing(false);
            setError(null);
            showToast('Profile updated!', 'success');
            window.location.reload(); // Force refresh to update nav profile picture
        } catch (err) {
            setError('Error updating profile: ' + err.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            setError('Error signing out: ' + error.message);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

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
            <div className="profile-container">
                <video autoPlay loop muted playsInline src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae" alt="wave" />
                <div className="profile-redesign">
                    <div className="profile-center-block">
                        <div className="profile-avatar-outer" style={{position: 'relative'}}>
                            <img 
                                src={
                                    (profile?.photoBase64 && profile.photoBase64 !== '') 
                                        ? profile.photoBase64 
                                        : (user.photoURL || '/User.png')
                                }
                                alt="Profile" 
                                className="profile-avatar-img"
                                onClick={isEditing ? handleImageClick : undefined}
                                style={{cursor: isEditing ? 'pointer' : 'default'}}
                            />
                            {isEditing && (
                                <div className="profile-picture-overlay" onClick={handleImageClick} style={{cursor: 'pointer'}}>
                                    <span>Change Photo</span>
                                </div>
                            )}
                            {uploadingImage && (
                                <div className="uploading-overlay">
                                    <span>Uploading...</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <h1 className="profile-nickname">{formData.nickname || user?.displayName || user?.email}</h1>
                        {!isEditing && (
                            <button 
                                className="edit-profile-button main"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                        )}
                        {isEditing && (
                            <div className="profile-edit-card">
                                <form onSubmit={handleSubmit} className="profile-edit-form">
                                    <div className="form-group">
                                        <label htmlFor="nickname">Nickname</label>
                                        <input
                                            type="text"
                                            id="nickname"
                                            name="nickname"
                                            value={formData.nickname}
                                            onChange={handleInputChange}
                                            placeholder="Your nickname"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="bio">About me</label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="specialisation">Specialisation</label>
                                        <select
                                            id="specialisation"
                                            name="specialisation"
                                            value={formData.specialisation}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select your specialisation</option>
                                            <option value="Web Development">Web Development</option>
                                            <option value="Motion Graphics">Motion Graphics</option>
                                            <option value="Web Design">Web Design</option>
                                            <option value="Branding">Branding</option>
                                            <option value="App Development">App Development</option>
                                            <option value="3D Modeling">3D Modeling</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Social Links</label>
                                        <input type="text" name="social.github" value={formData.socialLinks.github} onChange={handleInputChange} placeholder="GitHub URL" />
                                        <input type="text" name="social.linkedin" value={formData.socialLinks.linkedin} onChange={handleInputChange} placeholder="LinkedIn URL" />
                                        <input type="text" name="social.behance" value={formData.socialLinks.behance} onChange={handleInputChange} placeholder="Portfolio/Website URL" />
                                        <input type="text" name="social.dribbble" value={formData.socialLinks.dribbble} onChange={handleInputChange} placeholder="Dribbble URL" />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="edit-profile-button main" onClick={() => setIsEditing(false)} style={{marginRight:'1rem'}}>Cancel</button>
                                        <button type="submit" className="edit-profile-button main">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                    <div className="profile-info-cards">
                        <div className="profile-info-card">
                            <h2>About me</h2>
                            <p>{profile?.bio || 'No bio yet.'}</p>
                        </div>
                        <div className="profile-info-card">
                            <h2>Specialisation</h2>
                            <p>{profile?.specialisation || 'Not specified'}</p>
                        </div>
                    </div>
                    <div className="profile-social-card">
                        <h2>Social Links</h2>
                        <div className="profile-social-links">
                            {profile?.socialLinks?.github && (
                                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="profile-social-link github"><Github size={20}/> <span>{profile.socialLinks.github.replace('https://github.com/', '')}</span></a>
                            )}
                            {profile?.socialLinks?.linkedin && (
                                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="profile-social-link linkedin"><Linkedin size={20}/> <span>{profile.socialLinks.linkedin.replace('https://www.linkedin.com/in/', '')}</span></a>
                            )}
                            {profile?.socialLinks?.behance && (
                                <a href={profile.socialLinks.behance} target="_blank" rel="noopener noreferrer" className="profile-social-link behance"><Globe size={20}/> <span>{profile.socialLinks.behance.replace('https://www.behance.net/', '')}</span></a>
                            )}
                            {profile?.socialLinks?.dribbble && (
                                <a href={profile.socialLinks.dribbble} target="_blank" rel="noopener noreferrer" className="profile-social-link dribbble"><Dribbble size={20}/> <span>{profile.socialLinks.dribbble.replace('https://dribbble.com/', '')}</span></a>
                            )}
                        </div>
                    </div>
                </div>
                <button 
                    className="ButtonCustom3"
                    onClick={handleSignOut}
                >
                    Sign Out
                </button>
            </div>
        </motion.div>
    );
}

export default Profile; 