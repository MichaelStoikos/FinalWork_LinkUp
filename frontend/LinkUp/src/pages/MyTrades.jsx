import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import EditTradeModal from '../components/EditTradeModal';
import '../style/MyTrades.css';
import { Helmet } from 'react-helmet';
import React from 'react';
import { motion } from 'framer-motion';

function MyTrades() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trades'); // 'trades' or 'requests'
  const [myTrades, setMyTrades] = useState([]);
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState(null);
  const [creatorProfiles, setCreatorProfiles] = useState({});
  const [requesterProfiles, setRequesterProfiles] = useState({});

  useEffect(() => {
    if (auth.currentUser) {
      fetchMyTrades();
      fetchCollaborationRequests();
    } else {
      setError("You must be logged in to view your trades.");
      setLoading(false);
    }
  }, []);

  // Fetch creator profiles for all trades
  useEffect(() => {
    const fetchProfiles = async () => {
      const newProfiles = {};
      const uniqueUids = Array.from(new Set(myTrades.map(t => t.creatorUid)));
      await Promise.all(uniqueUids.map(async (uid) => {
        if (!uid) return;
        try {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newProfiles[uid] = docSnap.data();
          }
        } catch (e) {
          // ignore
        }
      }));
      setCreatorProfiles(newProfiles);
    };
    if (myTrades.length > 0) fetchProfiles();
  }, [myTrades]);

  // Fetch requester profiles for all collaboration requests
  useEffect(() => {
    const fetchRequesterProfiles = async () => {
      const newProfiles = {};
      const uniqueUids = Array.from(new Set(collaborationRequests.map(r => r.requesterUid)));
      await Promise.all(uniqueUids.map(async (uid) => {
        if (!uid) return;
        try {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newProfiles[uid] = docSnap.data();
          }
        } catch (e) {
          // ignore
        }
      }));
      setRequesterProfiles(newProfiles);
    };
    if (collaborationRequests.length > 0) fetchRequesterProfiles();
  }, [collaborationRequests]);

  const fetchMyTrades = async () => {
    try {
      setLoading(true);
      const tradesRef = collection(db, 'trades');
      
      // First, get all accepted collaboration requests where user is the requester
      const requestsRef = collection(db, 'collaborationRequests');
      const requestsQuery = query(
        requestsRef,
        where("requesterUid", "==", auth.currentUser.uid),
        where("status", "==", "accepted")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const collaboratorTradeIds = requestsSnapshot.docs.map(doc => doc.data().tradeId);

      // Get trades created by the user
      const creatorQuery = query(
        tradesRef,
        where("creatorUid", "==", auth.currentUser.uid),
        where("status", "in", ["open", "in-progress"])
      );
      
      // Get trades where user is a collaborator
      const collaboratorQuery = query(
        tradesRef,
        where("status", "in", ["open", "in-progress"])
      );

      // Execute both queries
      const [creatorSnapshot, collaboratorSnapshot] = await Promise.all([
        getDocs(creatorQuery),
        getDocs(collaboratorQuery)
      ]);

      // Combine and deduplicate results
      const creatorTrades = creatorSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        userRole: 'creator'
      }));
      
      const collaboratorTrades = collaboratorSnapshot.docs
        .filter(doc => collaboratorTradeIds.includes(doc.id))
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          userRole: 'collaborator'
        }));

      // Combine both arrays and remove duplicates
      const allTrades = [...creatorTrades, ...collaboratorTrades];
      const uniqueTrades = Array.from(new Map(allTrades.map(trade => [trade.id, trade])).values());

      // Fetch creator info for each trade
      const tradesWithCreatorInfo = await Promise.all(uniqueTrades.map(async (trade) => {
        try {
          const userRef = doc(db, 'users', trade.creatorUid);
          const userSnap = await getDoc(userRef);
          let creatorName = 'Anonymous User';
          let creatorProfilePic = '/User.png';
          if (userSnap.exists()) {
            const userData = userSnap.data();
            creatorName = userData.nickname || userData.displayName || 'Anonymous User';
            creatorProfilePic = userData.photoBase64 || userData.photoURL || '/User.png';
          }
          return {
            ...trade,
            creatorName,
            creatorProfilePic
          };
        } catch {
          return {
            ...trade,
            creatorName: 'Anonymous User',
            creatorProfilePic: '/User.png'
          };
        }
      }));
      
      setMyTrades(tradesWithCreatorInfo);
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
  if (error) return <div className="error-message">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <link
          rel="preload"
          as="video"
          href="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae"
        />
      </Helmet>
      <div className="my-trades-page">
        <video autoPlay loop muted playsInline src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae" alt="wave" />
        <div className="my-trades-content-box">
          <h1 className="my-trades-title">My Swaps</h1>
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
                myTrades.map((trade) => {
                  const creator = creatorProfiles[trade.creatorUid] || {};
                  return (
                    <div 
                      key={trade.id} 
                      className="trade-card custom-trade-card"
                      onClick={(e) => handleTradeClick(trade.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {trade.image && (
                        <img src={trade.image} alt={trade.name} className="trade-image" />
                      )}
                      <div className="trade-info">
                        <div className="trade-avatar-row">
                          <span className="trade-avatar">
                            {creator.photoBase64 ? (
                              <img src={creator.photoBase64} alt={creator.nickname || 'Profile'} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                            ) : (
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M16 20v-2a4 4 0 0 0-8 0v2"/></svg>
                            )}
                          </span>
                          <span className="trade-name">{creator.nickname || trade.creatorNickname || 'Anonymous'}</span>
                          <span className="trade-role">
                            {trade.userRole === 'creator' ? '(Created by you)' : '(Collaborating)'}
                          </span>
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
                          {trade.userRole === 'creator' && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="requests-container">
              {collaborationRequests.length === 0 ? (
                <p>No pending collaboration requests.</p>
              ) : (
                collaborationRequests.map((request) => {
                  const requester = requesterProfiles[request.requesterUid] || {};
                  return (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <button 
                          className="requester-link"
                          onClick={() => handleRequesterClick(request.requesterUid)}
                        >
                          <img 
                            src={requester.photoBase64 || "/User.png"} 
                            alt={requester.nickname || request.requesterNickname || "User"} 
                            className="requester-avatar"
                          />
                          <span>{requester.nickname || request.requesterNickname || "Anonymous"}</span>
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
                  );
                })
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
      </div>
    </motion.div>
  );
}

export default MyTrades; 