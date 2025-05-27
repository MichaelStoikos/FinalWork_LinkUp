import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateTradeModal from '../components/CreateTradeModal'
import AuthModal from '../components/AuthModal'
import { auth, db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import '../style/Trades.css'

function Trades() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [creatorProfiles, setCreatorProfiles] = useState({});

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch creator profiles for all trades
  useEffect(() => {
    const fetchProfiles = async () => {
      const newProfiles = {};
      const uniqueUids = Array.from(new Set(trades.map(t => t.creatorUid)));
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
    if (trades.length > 0) fetchProfiles();
  }, [trades]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/trades');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch trades');
      }
      const data = await response.json();
      // Only show trades with status 'open'
      setTrades(data.filter(trade => trade.status === 'open'));
    } catch (error) {
      console.error("Error fetching trades:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrade = async (tradeData) => {
    try {
      const response = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create trade');
      }

      // Refresh the trades list
      await fetchTrades();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating trade:", error);
      setError(error.message);
    }
  };

  const handleTradeClick = (tradeId) => {
    navigate(`/trade/${tradeId}`);
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Trades</h2>
        <p>{error}</p>
        <p>Please make sure the backend server is running at http://localhost:5000</p>
      </div>
    );
  }

  return (
    <>
    <div className="trades-page">
      <img className="trades-page-bg" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.gif?alt=media&token=594e9ca5-3bc6-49c4-8a75-bc782e628545" alt="wave" />
      <div className="trades-title">
        <h1>Trades</h1>
      </div>
      <div className="trades-header">
        <button 
          className="ButtonCustom"
          onClick={() => setIsModalOpen(true)}
        >
          Create Trade
        </button>
      </div>

      <div className="trades-container">
        {trades.length === 0 ? (
          <p></p>
        ) : (
          trades.map((trade) => {
            const creator = creatorProfiles[trade.creatorUid] || {};
            return (
              <div 
                key={trade._id} 
                className="trade-card custom-trade-card"
                onClick={() => handleTradeClick(trade._id)}
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <CreateTradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTrade}
          userProfile={userProfile}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
    </>
  );
}

export default Trades;
