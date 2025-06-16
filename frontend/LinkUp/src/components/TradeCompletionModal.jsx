import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import '../style/TradeCompletionModal.css';
import { useToast } from './ToastContext';

/**
 * TradeCompletionModal component for handling trade completion and reputation feedback.
 * Shows when both parties have accepted the trade and allows them to rate their experience.
 * Updates ELO reputation points based on feedback.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {string} props.tradeId - The ID of the completed trade
 * @param {string} props.partnerId - The ID of the trade partner
 * @param {string} props.tradeName - The name of the trade
 * @returns {JSX.Element|null} The rendered modal component or null if not open
 */
function TradeCompletionModal({ isOpen, onClose, tradeId, partnerId, tradeName }) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { showToast } = useToast();

  const ratingOptions = [
    { value: 'excellent', label: 'Excellent Experience', points: 25, emoji: '⭐' },
    { value: 'good', label: 'Good Experience', points: 15, emoji: '👍' },
    { value: 'neutral', label: 'Neutral Experience', points: 5, emoji: '😐' },
    { value: 'poor', label: 'Poor Experience', points: -15, emoji: '👎' }
  ];

  /**
   * Calculates ELO rating change based on the selected rating.
   * Uses a simplified ELO system where points are awarded/penalized based on experience.
   * 
   * @param {string} rating - The selected rating value
   * @returns {number} The ELO points to add/subtract
   */
  const calculateEloChange = (rating) => {
    const ratingOption = ratingOptions.find(option => option.value === rating);
    return ratingOption ? ratingOption.points : 0;
  };

  /**
   * Updates the partner's reputation in Firestore and records the feedback.
   * 
   * @param {string} rating - The selected rating value
   * @returns {Promise<void>}
   */
  const updateReputation = async (rating) => {
    if (!auth.currentUser || !partnerId) return;

    try {
      setSubmitting(true);
      const currentUserId = auth.currentUser.uid;
      const eloChange = calculateEloChange(rating);

      // Update partner's reputation (not current user's)
      const partnerRef = doc(db, 'users', partnerId);
      const partnerSnap = await getDoc(partnerRef);
      
      if (partnerSnap.exists()) {
        const partnerData = partnerSnap.data();
        const currentReputation = partnerData.reputation || 1000;
        const newReputation = Math.max(0, currentReputation + eloChange); // Ensure reputation doesn't go below 0
        
        await updateDoc(partnerRef, {
          reputation: newReputation,
          lastReputationUpdate: new Date().toISOString()
        });
      } else {
        // Create partner user document with initial reputation if it doesn't exist
        await updateDoc(partnerRef, {
          reputation: 1000 + eloChange,
          lastReputationUpdate: new Date().toISOString()
        });
      }

      // Record the feedback
      const feedbackRef = collection(db, 'tradeFeedback');
      await addDoc(feedbackRef, {
        tradeId,
        raterId: currentUserId,
        ratedId: partnerId,
        rating,
        eloChange,
        tradeName,
        createdAt: serverTimestamp()
      });

      // Send notification to partner about the feedback
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: partnerId,
        type: 'trade_feedback',
        message: `You received feedback for "${tradeName}"`,
        tradeId,
        fromUserId: currentUserId,
        rating,
        read: false,
        createdAt: serverTimestamp()
      });

      // Mark that the user has voted for this trade
      await setDoc(doc(db, `trades/${tradeId}/votes/${auth.currentUser.uid}`), { voted: true });

      setHasSubmitted(true);
      showToast('Thank you for your feedback!', 'success');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSelectedRating(null);
        setSubmitting(false);
        setHasSubmitted(false);
      }, 2000);

    } catch (error) {
      console.error('Error updating reputation:', error);
      showToast('Failed to submit feedback. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  /**
   * Handles rating selection and submission.
   * 
   * @param {string} rating - The selected rating value
   */
  const handleRatingSubmit = async (rating) => {
    setSelectedRating(rating);
    await updateReputation(rating);
  };

  if (!isOpen) return null;

  return (
    <div className="trade-completion-overlay">
      <div className="trade-completion-modal">
        <div className="modal-header">
          <h2>🎉 Trade Completed!</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-content">
          {!hasSubmitted ? (
            <>
              <div className="completion-message">
                <p>Congratulations! Your trade "<strong>{tradeName}</strong>" has been completed successfully.</p>
                <p>Please rate your experience with your trade partner:</p>
              </div>
              
              <div className="rating-options">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`rating-option ${selectedRating === option.value ? 'selected' : ''}`}
                    onClick={() => handleRatingSubmit(option.value)}
                    disabled={submitting}
                  >
                    <div className="rating-emoji">{option.emoji}</div>
                    <div className="rating-label">{option.label}</div>
                    <div className="rating-points">
                      {option.points > 0 ? '+' : ''}{option.points} ELO
                    </div>
                  </button>
                ))}
              </div>
              
              {submitting && (
                <div className="submitting-message">
                  <p>Submitting your feedback...</p>
                </div>
              )}
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Feedback Submitted!</h3>
              <p>Thank you for helping improve the community!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeCompletionModal; 