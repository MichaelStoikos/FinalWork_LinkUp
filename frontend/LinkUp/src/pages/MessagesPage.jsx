import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import ChatList from './ChatList';
import Messages from './Messages';
import '../style/MessagesPage.css';

function MessagesPage() {
  const [user] = useAuthState(auth);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);

  // If not logged in, redirect to home
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Function to receive chats from ChatList
  const handleChatsUpdate = (updatedChats) => {
    setChats(updatedChats);
  };

  // Effect to automatically select first chat if none selected
  useEffect(() => {
    if (!chatId && chats.length > 0) {
      navigate(`/messages/${chats[0].id}`);
    }
  }, [chatId, chats, navigate]);

  return (
    <div className="messages-page-2col">
      <img className="trades-page-bg" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.gif?alt=media&token=594e9ca5-3bc6-49c4-8a75-bc782e628545" alt="wave" />
      <div className="messages-sidebar">
        <ChatList onChatsUpdate={handleChatsUpdate} />
      </div>
      <div className="messages-main">
        {chatId ? (
          <Messages />
        ) : (
          <div className="messages-placeholder">
            <h2>Loading chats...</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage; 