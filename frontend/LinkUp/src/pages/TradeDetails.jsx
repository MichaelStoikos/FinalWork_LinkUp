import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import '../style/TradeDetails.css';

function TradeDetails() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    const fetchTradeDetails = async () => {
      try {
        setLoading(true);
        // First try to fetch from Firestore
        const tradeRef = doc(db, 'trades', tradeId);
        const tradeSnap = await getDoc(tradeRef);
        
        if (tradeSnap.exists()) {
          const tradeData = { id: tradeSnap.id, ...tradeSnap.data() };
          setTrade(tradeData);
          
          // Check if current user is the owner
          if (auth.currentUser && tradeData.creatorUid === auth.currentUser.uid) {
            setIsOwner(true);
          } else if (auth.currentUser) {
            // Check if user has already requested collaboration
            const requestsRef = collection(db, 'collaborationRequests');
            const q = query(
              requestsRef,
              where('tradeId', '==', tradeId),
              where('requesterUid', '==', auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            setHasRequested(!querySnapshot.empty);
          }
          
          // Fetch creator's profile if available
          if (tradeData.creatorUid) {
            const creatorRef = doc(db, 'users', tradeData.creatorUid);
            const creatorSnap = await getDoc(creatorRef);
            if (creatorSnap.exists()) {
              setCreatorProfile(creatorSnap.data());
            }
          }
        } else {
          // If not in Firestore, try the backend API
          const response = await fetch(`http://localhost:5000/api/trades/${tradeId}`);
          if (!response.ok) {
            throw new Error('Trade not found');
          }
          const data = await response.json();
          setTrade(data);
        }
      } catch (err) {
        console.error("Error fetching trade details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [tradeId]);

  const handleRequestCollaboration = async () => {
    if (!auth.currentUser) {
      // Show login modal or redirect to login
      return;
    }

    try {
      setRequestLoading(true);
      const requestsRef = collection(db, 'collaborationRequests');
      await addDoc(requestsRef, {
        tradeId,
        tradeName: trade.name,
        requesterUid: auth.currentUser.uid,
        requesterNickname: auth.currentUser.displayName || 'Anonymous',
        creatorUid: trade.creatorUid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setHasRequested(true);
    } catch (err) {
      console.error("Error requesting collaboration:", err);
      setError("Failed to send collaboration request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCreatorClick = () => {
    if (trade.creatorUid) {
      navigate(`/account/${trade.creatorUid}`);
    }
  };

  if (loading) return <div className="loading">Loading trade details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!trade) return <div className="error-message">Trade not found</div>;

  return (
    <div className="trade-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      
      <div className="trade-details-content">
        <div className="trade-header">
          <h1>{trade.name}</h1>
          {trade.creatorNickname && (
            <div className="trade-creator-info">
              <span>Created by: </span>
              <button 
                className="creator-link"
                onClick={handleCreatorClick}
              >
                {trade.creatorNickname}
              </button>
            </div>
          )}
        </div>

        {trade.image && (
          <div className="trade-image-container">
            <img src={trade.image} alt={trade.name} className="trade-detail-image" />
          </div>
        )}

        <div className="trade-details-grid">
          <div className="trade-section">
            <h2>Description</h2>
            <p>{trade.description}</p>
          </div>

          <div className="trade-section">
            <h2>Service Offered</h2>
            <p className="service-given">{trade.serviceGiven}</p>
          </div>

          {trade.tags && trade.tags.length > 0 && (
            <div className="trade-section">
              <h2>Tags</h2>
              <div className="trade-tags">
                {trade.tags.map((tag, idx) => (
                  <span key={idx} className="trade-tag-chip">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {!isOwner && auth.currentUser && (
            <div className="trade-section collaboration-section">
              <h2>Collaboration</h2>
              {hasRequested ? (
                <p className="request-status">Collaboration request sent!</p>
              ) : (
                <button
                  className="request-collaboration-btn"
                  onClick={handleRequestCollaboration}
                  disabled={requestLoading}
                >
                  {requestLoading ? 'Sending Request...' : 'Request Collaboration'}
                </button>
              )}
            </div>
          )}

          {creatorProfile && (
            <div className="trade-section">
              <h2>About the Creator</h2>
              <div className="creator-profile">
                {creatorProfile.photoBase64 && (
                  <img 
                    src={creatorProfile.photoBase64} 
                    alt={creatorProfile.nickname || 'Creator'} 
                    className="creator-avatar"
                  />
                )}
                <div className="creator-info">
                  <p className="creator-bio">{creatorProfile.bio || 'No bio available'}</p>
                  {creatorProfile.socialLinks && (
                    <div className="creator-social-links">
                      {creatorProfile.socialLinks.github && (
                        <a href={creatorProfile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                          GitHub
                        </a>
                      )}
                      {creatorProfile.socialLinks.linkedin && (
                        <a href={creatorProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeDetails; 