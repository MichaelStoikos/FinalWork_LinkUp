import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, or, getDocs, doc, getDoc } from 'firebase/firestore';
import '../style/ChatList.css';

function ChatList() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }
    const fetchChats = async () => {
      try {
        setLoading(true);
        // Get all accepted collaboration requests where user is creator or requester
        const requestsRef = collection(db, 'collaborationRequests');
        const q1 = query(requestsRef, where('creatorUid', '==', auth.currentUser.uid), where('status', '==', 'accepted'));
        const q2 = query(requestsRef, where('requesterUid', '==', auth.currentUser.uid), where('status', '==', 'accepted'));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allChats = [...snap1.docs, ...snap2.docs];
        // Fetch partner info for each chat
        const chatList = await Promise.all(allChats.map(async (docSnap) => {
          const data = docSnap.data();
          const partnerId = data.creatorUid === auth.currentUser.uid ? data.requesterUid : data.creatorUid;
          const partnerRef = doc(db, 'users', partnerId);
          const partnerSnap = await getDoc(partnerRef);
          return {
            id: docSnap.id,
            partner: partnerSnap.exists() ? partnerSnap.data() : { nickname: 'Unknown', photoBase64: '' },
            tradeName: data.tradeName || '',
          };
        }));
        setChats(chatList);
      } catch (err) {
        setError('Failed to load chats: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [navigate]);

  if (loading) return <div className="loading">Loading chats...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chat-list-container">
      <h1>Messages</h1>
      {chats.length === 0 ? (
        <p>No chats yet.</p>
      ) : (
        <div className="chat-list">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className="chat-list-item"
              onClick={() => navigate(`/messages/${chat.id}`)}
            >
              <img 
                src={chat.partner.photoBase64 || '/User.png'} 
                alt={chat.partner.nickname} 
                className="chat-list-avatar"
              />
              <div className="chat-list-info">
                <span className="chat-list-name">{chat.partner.nickname}</span>
                {chat.tradeName && <span className="chat-list-trade">Trade: {chat.tradeName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList; 