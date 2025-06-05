import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import '../style/ChatList.css';

function ChatList({ onChatsUpdate }) {
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
    let unsubMessages = null;
    let isMounted = true;
    const fetchChatsAndListen = async () => {
      try {
        setLoading(true);
        // Get all accepted collaboration requests where user is creator or requester
        const requestsRef = collection(db, 'collaborationRequests');
        const q1 = query(requestsRef, where('creatorUid', '==', auth.currentUser.uid), where('status', '==', 'accepted'));
        const q2 = query(requestsRef, where('requesterUid', '==', auth.currentUser.uid), where('status', '==', 'accepted'));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allChats = [...snap1.docs, ...snap2.docs];
        // Prepare chat info
        const chatInfoList = await Promise.all(allChats.map(async (docSnap) => {
          const data = docSnap.data();
          const partnerId = data.creatorUid === auth.currentUser.uid ? data.requesterUid : data.creatorUid;
          const partnerRef = doc(db, 'users', partnerId);
          const partnerSnap = await getDoc(partnerRef);
          return {
            id: docSnap.id,
            partner: partnerSnap.exists() ? partnerSnap.data() : { nickname: 'Unknown', photoBase64: '' },
            tradeName: data.tradeName || '',
            partnerId,
          };
        }));
        // Listen to all messages in real time
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'));
        unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
          // For each chat, find the latest message
          const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const chatListWithLatest = chatInfoList.map(chat => {
            const latestMsg = messages.find(msg => msg.chatId === chat.id);
            let latestMessage = '';
            let latestMessageTime = null;
            if (latestMsg) {
              if (latestMsg.text) {
                latestMessage = latestMsg.text;
              } else if (latestMsg.fileName) {
                latestMessage = `📎 ${latestMsg.fileName}`;
              }
              latestMessageTime = latestMsg.createdAt;
            }
            // Prefix with 'You:' or partner's name
            let messagePrefix = '';
            if (latestMsg) {
              if (latestMsg.senderId === auth.currentUser.uid) {
                messagePrefix = 'You: ';
              } else {
                messagePrefix = (chat.partner.nickname || 'Unknown') + ': ';
              }
            }
            return {
              ...chat,
              latestMessage: latestMsg ? (messagePrefix + latestMessage) : '',
              latestMessageTime,
            };
          });
          // Sort chats by latest message time (descending)
          chatListWithLatest.sort((a, b) => {
            if (!a.latestMessageTime && !b.latestMessageTime) return 0;
            if (!a.latestMessageTime) return 1;
            if (!b.latestMessageTime) return -1;
            return b.latestMessageTime.seconds - a.latestMessageTime.seconds;
          });
          if (isMounted) {
            setChats(chatListWithLatest);
            onChatsUpdate(chatListWithLatest);
          }
        });
        setError(null);
      } catch (err) {
        setError('Failed to load chats: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChatsAndListen();
    return () => {
      isMounted = false;
      if (unsubMessages) unsubMessages();
    };
  }, [navigate, onChatsUpdate]);

  const filteredChats = chats.filter(chat =>
    chat.partner.nickname.toLowerCase().includes(search.toLowerCase())
  );
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chat-list-container">
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
                <span className="chat-list-trade">
                  {chat.latestMessage ? chat.latestMessage : (chat.tradeName || '')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList; 