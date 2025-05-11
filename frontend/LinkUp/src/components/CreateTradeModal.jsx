import { useState } from 'react';
import './CreateTradeModal.css';

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

function CreateTradeModal({ isOpen, onClose, onSubmit }) {
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
    onSubmit(formData);
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Trade</h2>
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
                id="fileInput"
              />
              <label htmlFor="fileInput" className="file-drop-label">
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
              {uploading ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTradeModal; 