import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import EditTradeModal from '../components/EditTradeModal';
import '../style/MyTrades.css';

function MyTrades() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trades'); // 'trades' or 'requests'
  const [myTrades, setMyTrades] = useState([]);
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      fetchMyTrades();
      fetchCollaborationRequests();
    } else {
      setError("You must be logged in to view your trades.");
      setLoading(false);
    }
  }, []);

  const fetchMyTrades = async () => {
    try {
      setLoading(true);
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where("creatorUid", "==", auth.currentUser.uid), where("status", "==", "open"));
      const querySnapshot = await getDocs(q);
      const trades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyTrades(trades);
    } catch (err) {
      console.error("Error fetching my trades:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborationRequests = async () => {
    try {
      const requestsRef = collection(db, 'collaborationRequests');
      const q = query(
        requestsRef,
        where("creatorUid", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaborationRequests(requests);
    } catch (err) {
      console.error("Error fetching collaboration requests:", err);
      setError(err.message);
    }
  };

  const handleEdit = (trade) => {
    setCurrentTrade(trade);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (tradeId) => {
    try {
      await deleteDoc(doc(db, 'trades', tradeId));
      fetchMyTrades();
    } catch (err) {
      console.error('Error deleting trade:', err);
      setError('Failed to delete trade.');
    }
  };

  const handleEditSubmit = (updatedTrade) => {
    setIsEditModalOpen(false);
    setCurrentTrade(null);
    fetchMyTrades();
  };

  const handleTradeClick = (tradeId, event) => {
    if (event.target.closest('.trade-actions')) {
      return;
    }
    navigate(`/trade/${tradeId}`);
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const requestRef = doc(db, 'collaborationRequests', requestId);
      await updateDoc(requestRef, {
        status: action === 'accept' ? 'accepted' : 'rejected',
        updatedAt: new Date().toISOString()
      });
      
      if (action === 'accept') {
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.data();
        if (requestData && requestData.tradeId) {
          const tradeRef = doc(db, 'trades', requestData.tradeId);
          await updateDoc(tradeRef, { status: 'in-progress' });
        }
        navigate(`/messages/${requestId}`);
      }
      
      fetchCollaborationRequests();
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      setError(`Failed to ${action} request`);
    }
  };

  const handleRequesterClick = (userId) => {
    navigate(`/account/${userId}`);
  };

  if (loading) return <div>Loading my trades...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-trades-page">
      <h1>My Trades</h1>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          My Trades
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Collaboration Requests
          {collaborationRequests.length > 0 && (
            <span className="request-badge">{collaborationRequests.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'trades' ? (
        <div className="trades-container">
          {myTrades.length === 0 ? (
            <p>You haven't created any trades yet.</p>
          ) : (
            myTrades.map((trade) => (
              <div 
                key={trade.id} 
                className="trade-card custom-trade-card"
                onClick={(e) => handleTradeClick(trade.id, e)}
                style={{ cursor: 'pointer' }}
              >
                {trade.image && (
                  <img src={trade.image} alt={trade.name} className="trade-image" />
                )}
                {trade.creatorNickname && (
                  <div className="trade-creator">
                    <span>By: {trade.creatorNickname}</span>
                  </div>
                )}
                <div className="trade-info">
                  <div className="trade-avatar-row">
                    <span className="trade-avatar">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M16 20v-2a4 4 0 0 0-8 0v2"/></svg>
                    </span>
                    <span className="trade-name">{trade.name}</span>
                  </div>
                  <p className="trade-description">{trade.description}</p>
                  <div className="trade-service">
                    Service you get: <b>{trade.serviceGiven}</b>
                  </div>
                  <div className="trade-tags">
                    {Array.isArray(trade.tags) && trade.tags.map((tag, idx) => (
                      <span key={idx} className="trade-tag-chip">{tag}</span>
                    ))}
                  </div>
                  <div className="trade-actions" style={{ marginTop: '1rem' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(trade);
                      }} 
                      className="edit-trade-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(trade.id);
                      }} 
                      className="delete-trade-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="requests-container">
          {collaborationRequests.length === 0 ? (
            <p>No pending collaboration requests.</p>
          ) : (
            collaborationRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <button 
                    className="requester-link"
                    onClick={() => handleRequesterClick(request.requesterUid)}
                  >
                    <img 
                      src="/User.png" 
                      alt={request.requesterNickname} 
                      className="requester-avatar"
                    />
                    <span>{request.requesterNickname}</span>
                  </button>
                  <span className="request-trade">
                    requested collaboration for <strong>{request.tradeName}</strong>
                  </span>
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleRequestAction(request.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleRequestAction(request.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isEditModalOpen && currentTrade && (
        <EditTradeModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setCurrentTrade(null); }}
          trade={currentTrade}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}

export default MyTrades; 