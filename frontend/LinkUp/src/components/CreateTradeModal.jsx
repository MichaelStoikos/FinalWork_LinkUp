import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import LoginRequired from './LoginRequired';
import '../style/CreateTradeModal.css';

const DIFFICULTY_OPTIONS = [
  'Beginner-friendly',
  'Intermediate',
  'Advanced',
  'Expert'
];

const SERVICE_OPTIONS = [
  'Web Development',
  'Motion Graphics',
  'Web Design',
  'Branding',
  'App Development',
  '3D Modeling'
];

function CreateTradeModal({ isOpen, onClose, onSubmit, onLoginClick, userProfile }) {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: '',
    serviceGiven: '',
    serviceWanted: '',
    tags: [],
    image: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const validateImage = (file) => {
    setImageError('');
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image size must be less than 500KB. Please choose a smaller image or compress it.');
      return false;
    }
    return true;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validateImage(file)) {
        e.target.value = ''; // Reset the file input
        return;
      }
      setUploading(true);
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, image: base64 }));
      setImagePreview(base64);
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!validateImage(file)) {
        return;
      }
      setUploading(true);
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, image: base64 }));
      setImagePreview(base64);
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const tradeData = {
      ...formData,
      creatorUid: user?.uid,
      creatorNickname: userProfile?.nickname || userProfile?.displayName || userProfile?.email || '',
      createdAt: new Date().toISOString(),
    };
    onSubmit(tradeData);
    setUploading(false);
    setFormData({
      name: '',
      description: '',
      difficulty: '',
      serviceGiven: '',
      serviceWanted: '',
      tags: [],
      image: ''
    });
    setImagePreview('');
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>&times;</button>
          <LoginRequired onLoginClick={onLoginClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Trade Creation</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-flex">
            <div className="form-left">
              <div className="form-group">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Job Name"
                  required
                />
              </div>
              <div className="form-group">
                <div
                  className="file-drop-area"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="file-drop-label">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <>
                        <span role="img" aria-label="upload">📁</span> 
                        <div>DRAG FILES TO UPLOAD</div>
                        <div className="file-size-hint">Max size: 500KB</div>
                      </>
                    )}
                  </label>
                </div>
                {imageError && (
                  <div className="image-error-message">
                    {imageError}
                  </div>
                )}
              </div>
              <div className="form-group">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short Description"
                  required
                />
              </div>
            </div>
            <div className="form-right">
              <div className="form-group">
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  required
                >
                  <option value="">Difficulty Level</option>
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <select
                  id="serviceGiven"
                  name="serviceGiven"
                  value={formData.serviceGiven}
                  onChange={handleChange}
                  required
                >
                  <option value="">Service Given</option>
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <select
                  id="serviceWanted"
                  name="serviceWanted"
                  value={formData.serviceWanted}
                  onChange={handleChange}
                  required
                >
                  <option value="">Service Wanted</option>
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <div className="tags-input-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Add a New Tag"
                  />
                  <button type="button" onClick={handleTagAdd}>+</button>
                </div>
                <div className="tags-list">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag-chip">
                      {tag}
                      <button type="button" onClick={() => handleTagRemove(tag)}>&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Create Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTradeModal; 