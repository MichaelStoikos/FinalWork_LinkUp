import React, { useState } from 'react';
import { db, storage, auth } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../style/DeliverWorkModal.css';

/**
 * DeliverWorkModal component for uploading and submitting deliverables in a trade collaboration.
 * Handles both preview and final deliverables with file uploads and link submissions.
 * Supports multiple files and links with descriptions for each deliverable type.
 * 
 * @param {Object} props - Component props
 * @param {string} props.tradeId - The unique identifier for the trade/collaboration
 * @param {string} props.userId - The current user's unique identifier
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Function} props.onDelivery - Callback function called after successful delivery
 * @param {string} props.partnerId - The partner's unique identifier for notifications
 * @returns {JSX.Element|null} The rendered modal component or null if not open
 */
function DeliverWorkModal({ tradeId, userId, isOpen, onClose, onDelivery, partnerId }) {
  // State for preview deliverables
  const [previewFiles, setPreviewFiles] = useState([]);
  const [previewLinks, setPreviewLinks] = useState([{ url: '', description: '' }]);
  const [previewDesc, setPreviewDesc] = useState('');
  // State for final deliverables
  const [finalFiles, setFinalFiles] = useState([]);
  const [finalLinks, setFinalLinks] = useState([{ url: '', description: '' }]);
  const [finalDesc, setFinalDesc] = useState('');
  // General state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  /**
   * Updates the preview files state with selected files.
   * 
   * @param {Event} e - The file input change event
   */
  const handlePreviewFileChange = (e) => setPreviewFiles([...e.target.files]);

  /**
   * Updates a specific field in a preview link at the given index.
   * 
   * @param {number} idx - The index of the link to update
   * @param {string} field - The field name to update ('url' or 'description')
   * @param {string} value - The new value for the field
   */
  const handlePreviewLinkChange = (idx, field, value) => {
    const newLinks = [...previewLinks];
    newLinks[idx][field] = value;
    setPreviewLinks(newLinks);
  };

  /**
   * Adds a new empty link field to the preview links array.
   */
  const addPreviewLinkField = () => setPreviewLinks([...previewLinks, { url: '', description: '' }]);

  /**
   * Removes a link field from the preview links array at the specified index.
   * 
   * @param {number} idx - The index of the link to remove
   */
  const removePreviewLinkField = (idx) => setPreviewLinks(previewLinks.filter((_, i) => i !== idx));

  /**
   * Updates the final files state with selected files.
   * 
   * @param {Event} e - The file input change event
   */
  const handleFinalFileChange = (e) => setFinalFiles([...e.target.files]);

  /**
   * Updates a specific field in a final link at the given index.
   * 
   * @param {number} idx - The index of the link to update
   * @param {string} field - The field name to update ('url' or 'description')
   * @param {string} value - The new value for the field
   */
  const handleFinalLinkChange = (idx, field, value) => {
    const newLinks = [...finalLinks];
    newLinks[idx][field] = value;
    setFinalLinks(newLinks);
  };

  /**
   * Adds a new empty link field to the final links array.
   */
  const addFinalLinkField = () => setFinalLinks([...finalLinks, { url: '', description: '' }]);

  /**
   * Removes a link field from the final links array at the specified index.
   * 
   * @param {number} idx - The index of the link to remove
   */
  const removeFinalLinkField = (idx) => setFinalLinks(finalLinks.filter((_, i) => i !== idx));

  /**
   * Handles form submission by uploading files and saving links to Firebase.
   * Processes both preview and final deliverables, sends notifications, and resets form state.
   * 
   * @async
   * @param {Event} e - The form submit event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Upload preview files
      for (const file of previewFiles) {
        const fileId = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `deliverables/${tradeId}/${userId}/preview/${fileId}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await addDoc(
          collection(db, 'deliverables'),
          {
            tradeId,
            userId,
            type: 'preview',
            downloadURL,
            fileType: file.type,
            fileName: file.name,
            description: previewDesc,
            createdAt: serverTimestamp(),
            accepted: false,
          }
        );
      }
      // 2. Upload final files
      for (const file of finalFiles) {
        const fileId = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `deliverables/${tradeId}/${userId}/final/${fileId}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await addDoc(
          collection(db, 'deliverables'),
          {
            tradeId,
            userId,
            type: 'final',
            downloadURL,
            fileType: file.type,
            fileName: file.name,
            description: finalDesc,
            createdAt: serverTimestamp(),
            accepted: false,
          }
        );
      }
      // 3. Save preview links
      for (const link of previewLinks) {
        if (link.url.trim()) {
          await addDoc(
            collection(db, 'deliverables'),
            {
              tradeId,
              userId,
              type: 'preview',
              downloadURL: link.url,
              description: link.description,
              createdAt: serverTimestamp(),
              accepted: false,
              isLink: true,
            }
          );
        }
      }
      // 4. Save final links
      for (const link of finalLinks) {
        if (link.url.trim()) {
          await addDoc(
            collection(db, 'deliverables'),
            {
              tradeId,
              userId,
              type: 'final',
              downloadURL: link.url,
              description: link.description,
              createdAt: serverTimestamp(),
              accepted: false,
              isLink: true,
            }
          );
        }
      }
      setSuccess('Deliverables uploaded successfully!');
      setPreviewFiles([]);
      setPreviewLinks([{ url: '', description: '' }]);
      setPreviewDesc('');
      setFinalFiles([]);
      setFinalLinks([{ url: '', description: '' }]);
      setFinalDesc('');
      // Send notification to partner
      if (partnerId) {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: partnerId,
          type: 'delivery',
          message: `${auth.currentUser?.displayName || 'Someone'} has delivered their work`,
          tradeId,
          fromUserId: userId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      setTimeout(() => {
        setSuccess('');
        onClose();
        if (onDelivery) onDelivery();
      }, 1500);
    } catch (err) {
      setError('Error uploading deliverables. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="deliver-modal-overlay">
      <div className="deliver-modal wide-modal">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Deliver Your Work</h2>
        <form onSubmit={handleSubmit}>
          <div className="deliver-sections-row">
            {/* Preview Deliverables Section */}
            <div className="deliver-section">
              <h3>Preview Deliverables (Screenshots, Videos, etc.)</h3>
              <div className="form-group">
                <label>Upload Files (watermarked):</label>
                <input type="file" multiple onChange={handlePreviewFileChange} disabled={uploading} />
              </div>
              <div className="form-group">
                <label>Description (optional):</label>
                <textarea value={previewDesc} onChange={e => setPreviewDesc(e.target.value)} placeholder="Describe your preview..." disabled={uploading} />
              </div>
              <div className="form-group">
                <label>Links (demo, preview, etc.):</label>
                {previewLinks.map((link, idx) => (
                  <div key={idx} className="link-row">
                    <input type="url" placeholder="https://your-link.com" value={link.url} onChange={e => handlePreviewLinkChange(idx, 'url', e.target.value)} disabled={uploading} />
                    <input type="text" placeholder="Description" value={link.description} onChange={e => handlePreviewLinkChange(idx, 'description', e.target.value)} disabled={uploading} />
                    {previewLinks.length > 1 && (
                      <button type="button" onClick={() => removePreviewLinkField(idx)} disabled={uploading}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPreviewLinkField} disabled={uploading}>Add Another Link</button>
              </div>
            </div>
            {/* Final Deliverables Section */}
            <div className="deliver-section">
              <h3>Final Deliverables (Repo, Website, etc.)</h3>
              <div className="form-group">
                <label>Upload Files (final):</label>
                <input type="file" multiple onChange={handleFinalFileChange} disabled={uploading} />
              </div>
              <div className="form-group">
                <label>Description (optional):</label>
                <textarea value={finalDesc} onChange={e => setFinalDesc(e.target.value)} placeholder="Describe your final delivery..." disabled={uploading} />
              </div>
              <div className="form-group">
                <label>Links (repo, website, etc.):</label>
                {finalLinks.map((link, idx) => (
                  <div key={idx} className="link-row">
                    <input type="url" placeholder="https://your-link.com" value={link.url} onChange={e => handleFinalLinkChange(idx, 'url', e.target.value)} disabled={uploading} />
                    <input type="text" placeholder="Description" value={link.description} onChange={e => handleFinalLinkChange(idx, 'description', e.target.value)} disabled={uploading} />
                    {finalLinks.length > 1 && (
                      <button type="button" onClick={() => removeFinalLinkField(idx)} disabled={uploading}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addFinalLinkField} disabled={uploading}>Add Another Link</button>
              </div>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="modal-footer">
            <button type="submit" className="submit-button" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeliverWorkModal;
