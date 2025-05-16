import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import '../style/Profile.css';

function Profile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        nickname: '',
        bio: '',
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
        <div className="profile-container">
            <div className="profile-header">
                <div 
                    className={`profile-picture-container ${isEditing ? 'editable' : ''}`}
                    onClick={handleImageClick}
                >
                    <img 
                        src={
                            (profile?.photoBase64 && profile.photoBase64 !== '') 
                                ? profile.photoBase64 
                                : (user.photoURL || '/User.png')
                        }
                        alt="Profile" 
                        className="profile-picture"
                    />
                    {isEditing && (
                        <div className="profile-picture-overlay">
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
                <h1>{user.displayName || user.email}</h1>
                {!isEditing && (
                    <button 
                        className="edit-button"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
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
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Tell us about yourself"
                            rows="4"
                        />
                    </div>

                    <div className="form-group">
                        <label>Social Links</label>
                        <input
                            type="url"
                            name="social.github"
                            value={formData.socialLinks.github}
                            onChange={handleInputChange}
                            placeholder="GitHub URL"
                        />
                        <input
                            type="url"
                            name="social.linkedin"
                            value={formData.socialLinks.linkedin}
                            onChange={handleInputChange}
                            placeholder="LinkedIn URL"
                        />
                        <input
                            type="url"
                            name="social.behance"
                            value={formData.socialLinks.behance}
                            onChange={handleInputChange}
                            placeholder="Behance URL"
                        />
                        <input
                            type="url"
                            name="social.dribbble"
                            value={formData.socialLinks.dribbble}
                            onChange={handleInputChange}
                            placeholder="Dribbble URL"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-button">
                            Save Changes
                        </button>
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    nickname: profile.nickname || '',
                                    bio: profile.bio || '',
                                    tags: profile.tags || [],
                                    availability: profile.availability || [],
                                    socialLinks: profile.socialLinks || {
                                        github: '',
                                        linkedin: '',
                                        behance: '',
                                        dribbble: ''
                                    }
                                });
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="profile-info">
                    <div className="info-section">
                        <h2>About</h2>
                        <p>{profile?.bio || 'No bio yet'}</p>
                    </div>

                    <div className="info-section">
                        <h2>Social Links</h2>
                        <div className="social-links">
                            {profile?.socialLinks?.github && (
                                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                                    GitHub
                                </a>
                            )}
                            {profile?.socialLinks?.linkedin && (
                                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                    LinkedIn
                                </a>
                            )}
                            {profile?.socialLinks?.behance && (
                                <a href={profile.socialLinks.behance} target="_blank" rel="noopener noreferrer">
                                    Behance
                                </a>
                            )}
                            {profile?.socialLinks?.dribbble && (
                                <a href={profile.socialLinks.dribbble} target="_blank" rel="noopener noreferrer">
                                    Dribbble
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <button 
                className="sign-out-button"
                onClick={handleSignOut}
                style={{ margin: '2rem auto 0', display: 'block' }}
            >
                Sign Out
            </button>
        </div>
    );
}

export default Profile; 