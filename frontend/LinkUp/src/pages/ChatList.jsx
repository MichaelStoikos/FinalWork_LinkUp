import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, or, getDocs, doc, getDoc } from 'firebase/firestore';
import '../style/ChatList.css';

function ChatList() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

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

  const filteredChats = chats.filter(chat =>
    chat.partner.nickname.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading chats...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chat-list-container">
      <img className="trades-page-bg" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.gif?alt=media&token=594e9ca5-3bc6-49c4-8a75-bc782e628545" alt="wave" />
      <input
        className="chat-list-search"
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filteredChats.length === 0 ? (
        <p>No chats yet.</p>
      ) : (
        <div className="chat-list">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-list-item${chat.id === chatId ? ' selected' : ''}`}
              onClick={() => navigate(`/messages/${chat.id}`)}
              tabIndex={0}
            >
              <img 
                src={chat.partner.photoBase64 || '/User.png'} 
                alt={chat.partner.nickname} 
                className="chat-list-avatar"
              />
              <div className="chat-list-info">
                <span className="chat-list-name">{chat.partner.nickname}</span>
                {chat.tradeName && <span className="chat-list-trade">{chat.tradeName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList; 