import React, { useState } from 'react';
import { db, storage } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../style/CreateTradeModal.css';
import { useToast } from './ToastContext';

const DIFFICULTY_OPTIONS = [
  'Beginner-friendly',
  'Intermediate',
  'Advanced',
  'Expert'
];

const SERVICE_OPTIONS = [
  'Web Development',
  'Design',
  'Showreel',
  'Marketing',
  'Writing',
  'Other'
];

/**
 * EditTradeModal component for editing existing trade/collaboration opportunities.
 * Handles form updates, image upload, tag management, and trade modification.
 * Pre-populates form with existing trade data and updates Firestore on submission.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Object} props.trade - The trade object to be edited
 * @param {Function} props.onSubmit - Callback function called with updated trade data
 * @returns {JSX.Element|null} The rendered modal component or null if not open
 */
function EditTradeModal({ isOpen, onClose, trade, onSubmit }) {
  const [formData, setFormData] = useState(trade || {
    name: '',
    description: '',
    difficulty: '',
    serviceGiven: '',
    serviceWanted: '',
    tags: [],
    image: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(trade?.image || '');
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  /**
   * Updates form data when the trade prop changes.
   * Resets form state and image preview to match the new trade data.
   */
  React.useEffect(() => {
    setFormData(trade || {
      name: '',
      description: '',
      difficulty: '',
      serviceGiven: '',
      serviceWanted: '',
      tags: [],
      image: ''
    });
    setImagePreview(trade?.image || '');
  }, [trade]);

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
      try {
        const fileRef = ref(storage, `trade-images/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
      } catch (err) {
        alert('Failed to upload image. Please try again.');
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
      try {
        const fileRef = ref(storage, `trade-images/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
      } catch (err) {
        alert('Failed to upload image. Please try again.');
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
   * Handles form submission by updating the trade document in Firestore.
   * Merges updated form data with existing trade data and calls the onSubmit callback.
   * 
   * @async
   * @param {Event} e - The form submit event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const tradeRef = doc(db, 'trades', trade.id);
      await updateDoc(tradeRef, formData);
      onSubmit({ ...trade, ...formData });
      showToast('Trade updated!', 'success');
      onClose();
    } catch (err) {
      alert('Error updating trade: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Trade</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Job Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level:</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              required
            >
              <option value="">Select difficulty</option>
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="serviceGiven">Service Given:</label>
            <select
              id="serviceGiven"
              name="serviceGiven"
              value={formData.serviceGiven}
              onChange={handleChange}
              required
            >
              <option value="">Select service</option>
              {SERVICE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="serviceWanted">Service Wanted:</label>
            <select
              id="serviceWanted"
              name="serviceWanted"
              value={formData.serviceWanted}
              onChange={handleChange}
              required
            >
              <option value="">Select service</option>
              {SERVICE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tags:</label>
            <div className="tags-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a new tag"
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

          <div className="form-group">
            <label>Image/File:</label>
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
                id="fileInputEdit"
              />
              <label htmlFor="fileInputEdit" className="file-drop-label">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <>
                    <span role="img" aria-label="upload">📁</span> Drag files here or click to upload
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Short Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTradeModal; 