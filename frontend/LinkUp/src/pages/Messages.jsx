import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../style/Messages.css';

function Messages() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    const fetchChatDetails = async () => {
      try {
        // Get chat details from collaboration request
        const requestRef = doc(db, 'collaborationRequests', chatId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
          throw new Error('Chat not found');
        }

        const requestData = requestSnap.data();
        if (requestData.status !== 'accepted') {
          throw new Error('Chat is not available');
        }

        // Determine chat partner
        const partnerId = requestData.creatorUid === auth.currentUser.uid 
          ? requestData.requesterUid 
          : requestData.creatorUid;

        // Fetch partner's profile
        const partnerRef = doc(db, 'users', partnerId);
        const partnerSnap = await getDoc(partnerRef);
        if (partnerSnap.exists()) {
          setChatPartner(partnerSnap.data());
        }

        // Subscribe to messages
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('chatId', '==', chatId),
          orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(newMessages);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching chat:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploadingFile) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        chatId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Anonymous',
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError(null);

      // Upload file to Firebase Storage
      const storageRef = ref(storage, `chat-files/${chatId}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Save message with file info
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        chatId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Anonymous',
        fileName: file.name,
        fileUrl: downloadURL,
        fileType: file.type,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
    }
  };

  if (loading) return <div className="loading">Loading chat...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="messages-container">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        {chatPartner && (
          <div className="chat-partner-info">
            <img 
              src={chatPartner.photoBase64 || '/User.png'} 
              alt={chatPartner.nickname} 
              className="partner-avatar"
            />
            <h2>{chatPartner.nickname}</h2>
          </div>
        )}
      </div>

      <div className="messages-list">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
          >
            {message.text && <p className="message-text">{message.text}</p>}
            {message.fileUrl && (
              <div className="file-message">
                <button 
                  className="file-download-btn"
                  onClick={() => handleDownloadFile(message.fileUrl, message.fileName)}
                >
                  📎 {message.fileName}
                </button>
              </div>
            )}
            <span className="message-time">
              {message.createdAt?.toDate().toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={uploadingFile}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button 
          type="button" 
          className="file-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile}
        >
          📎
        </button>
        <button 
          type="submit" 
          className="send-message-btn"
          disabled={(!newMessage.trim() && !uploadingFile) || uploadingFile}
        >
          {uploadingFile ? 'Uploading...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default Messages; 