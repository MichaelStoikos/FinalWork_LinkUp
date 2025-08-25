import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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


/**
 * Messages component for real-time chat functionality between collaboration partners.
 * Handles message sending, file uploads, and integrates with deliverables panel.
 * Provides real-time message updates and notification system.
 * 
 * @returns {JSX.Element} The rendered messages chat component
 */
function Messages() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);


  /**
   * Fetches chat details and sets up real-time message listener.
   * Determines chat partner and validates collaboration request status.
   */
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    const fetchChatDetails = async () => {
      try {
        const requestRef = doc(db, 'collaborationRequests', chatId);
        const requestSnap = await getDoc(requestRef);
        
        if (!requestSnap.exists()) {
          throw new Error('Chat not found');
        }

        const requestData = requestSnap.data();
        if (requestData.status !== 'accepted') {
          throw new Error('Chat is not available');
        }

        const partnerId = requestData.creatorUid === auth.currentUser.uid 
          ? requestData.requesterUid 
          : requestData.creatorUid;
        setPartnerId(partnerId);

        const partnerRef = doc(db, 'users', partnerId);
        const partnerSnap = await getDoc(partnerRef);
        if (partnerSnap.exists()) {
          setChatPartner(partnerSnap.data());
        }

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

  /**
   * Scrolls to the bottom of the messages list when new messages arrive.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends a text message and creates a notification for the chat partner.
   * 
   * @param {Event} e - Form submit event
   * @returns {Promise<void>}
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploadingFile) return;

    try {
      console.log('Sending message...');
      const messagesRef = collection(db, 'messages');
      const messageDoc = await addDoc(messagesRef, {
        chatId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Anonymous',
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      console.log('Message sent:', messageDoc.id);

      console.log('Creating notification for chat partner:', partnerId);
      const notificationsRef = collection(db, 'notifications');
      const notificationData = {
        userId: partnerId,
        type: 'message',
        message: `${auth.currentUser.displayName || 'Someone'} sent you a message: "${newMessage.trim().substring(0, 50)}${newMessage.trim().length > 50 ? '...' : ''}"`,
        chatId: chatId,
        read: false,
        createdAt: serverTimestamp()
      };
      console.log('Notification data:', notificationData);
      const notificationDoc = await addDoc(notificationsRef, notificationData);
      console.log('Notification created:', notificationDoc.id);

      setNewMessage('');
    } catch (err) {
      console.error("Error in message sending process:", err);
      setError("Failed to send message");
    }
  };

  /**
   * Uploads a file to Firebase Storage and creates a file message.
   * 
   * @param {Event} e - File input change event
   * @returns {Promise<void>}
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError(null);

      const storageRef = ref(storage, `chat-files/${chatId}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

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

  /**
   * Downloads a file from the provided URL and triggers browser download.
   * 
   * @param {string} fileUrl - The URL of the file to download
   * @param {string} fileName - The name to save the file as
   * @returns {Promise<void>}
   */
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
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="messages-container-flex">
      <div className="messages-main-panel"> 
        <div className="chat-header">
          
          {chatPartner && (
            <div 
              className="chat-partner-info partner-link-row"
              onClick={() => partnerId && navigate(`/account/${partnerId}`)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={chatPartner.photoBase64 || '/User.png'} 
                alt={chatPartner.nickname || 'User'}
                className="chat-partner-avatar"
              />
              <span className="chat-partner-nickname">{chatPartner.nickname || 'User'}</span>
            </div>
          )}
          <Link
            to={`/deliverables/${chatId}`}
            className="deliverables-btn"
            title="View Deliverables"
          >
            Deliverables
          </Link>
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

    </div>
  );
}

export default Messages; 