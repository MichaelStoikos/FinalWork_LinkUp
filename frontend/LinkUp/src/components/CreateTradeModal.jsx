import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage } from '../firebase/config';
import LoginRequired from './LoginRequired';
import LoginRequiredOverlay from './LoginRequiredOverlay';
import '../style/CreateTradeModal.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from './ToastContext';

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

/**
 * CreateTradeModal component for creating new trade/collaboration opportunities.
 * Handles form input, image upload, tag management, and trade submission.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Function} props.onSubmit - Callback function called with trade data on submission
 * @param {Function} props.onLoginClick - Callback function for login button clicks
 * @param {Object} props.userProfile - Current user's profile information
 * @returns {JSX.Element|null} The rendered modal component or null if not open
 */
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
  const { showToast } = useToast();

  /**
   * Updates form data when input fields change.
   * 
   * @param {Event} e - The change event from the input element
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Adds a new tag to the trade if it's not already present.
   * Clears the tag input field after successful addition.
   */
  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  /**
   * Removes a specific tag from the trade's tag list.
   * 
   * @param {string} tag - The tag to remove
   */
  const handleTagRemove = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  /**
   * Handles file selection and uploads the image to Firebase Storage.
   * Updates form data and preview with the uploaded image URL.
   * 
   * @async
   * @param {Event} e - The file input change event
   * @returns {Promise<void>}
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setImageError('');
      try {
        const fileRef = ref(storage, `trade-images/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
      } catch (err) {
        setImageError('Failed to upload image. Please try again.');
      }
      setUploading(false);
    }
  };

  /**
   * Handles file drop events for drag-and-drop image upload.
   * Uploads the dropped file to Firebase Storage and updates the form.
   * 
   * @async
   * @param {DragEvent} e - The drop event
   * @returns {Promise<void>}
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploading(true);
      setImageError('');
      try {
        const fileRef = ref(storage, `trade-images/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
      } catch (err) {
        setImageError('Failed to upload image. Please try again.');
      }
      setUploading(false);
    }
  };

  /**
   * Prevents default browser behavior for drag over events.
   * 
   * @param {DragEvent} e - The drag over event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Handles form submission with validation and trade creation.
   * Validates required fields, creates trade data, and calls the onSubmit callback.
   * 
   * @async
   * @param {Event} e - The form submit event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    if (!formData.tags || formData.tags.length === 0) {
      setImageError('Please add at least one tag.');
      setUploading(false);
      return;
    }
    
    if (!formData.image) {
      setImageError('Please upload an image.');
      setUploading(false);
      return;
    }
    
    const tradeData = {
      ...formData,
      creatorUid: user?.uid,
      creatorNickname: userProfile?.nickname || userProfile?.displayName || userProfile?.email || '',
      createdAt: new Date().toISOString(),
    };
    onSubmit(tradeData);
    showToast('Trade created!', 'success');
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
      <LoginRequiredOverlay onClose={onClose} />
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