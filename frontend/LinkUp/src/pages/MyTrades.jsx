import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import EditTradeModal from '../components/EditTradeModal';

function MyTrades() {
  const navigate = useNavigate();
  const [myTrades, setMyTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState(null);

  useEffect(() => {
    fetchMyTrades();
  }, []);

  const fetchMyTrades = async () => {
    if (!auth.currentUser) {
      setError("You must be logged in to view your trades.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where("creatorUid", "==", auth.currentUser.uid));
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

  if (loading) return <div>Loading my trades...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-trades-page">
      <h1>My Trades</h1>
      {myTrades.length === 0 ? (
        <p>You haven't created any trades yet.</p>
      ) : (
        <div className="trades-container">
          {myTrades.map((trade) => (
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
          ))}
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