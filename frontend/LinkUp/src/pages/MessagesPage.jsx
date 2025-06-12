import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import ChatList from './ChatList';
import Messages from './Messages';
import { motion } from 'framer-motion';
import '../style/MessagesPage.css';
import { Helmet } from 'react-helmet';

/**
 * MessagesPage component for the main messaging interface.
 * Displays a two-column layout with chat list sidebar and main messages area.
 * Handles authentication, chat selection, and automatic navigation.
 * 
 * @returns {JSX.Element} The rendered messages page component
 */
function MessagesPage() {
  const [user] = useAuthState(auth);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);

  /**
   * Redirects to home page if user is not authenticated.
   */
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  /**
   * Updates the chats state with data received from ChatList component.
   * 
   * @param {Array} updatedChats - The updated array of chat objects
   */
  const handleChatsUpdate = (updatedChats) => {
    setChats(updatedChats);
  };

  /**
   * Automatically navigates to the first chat if no chat is currently selected.
   */
  useEffect(() => {
    if (!chatId && chats.length > 0) {
      navigate(`/messages/${chats[0].id}`);
    }
  }, [chatId, chats, navigate]);

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
      <div className="messages-page-2col">
        <video autoPlay loop muted playsInline className="trades-page-bg" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae" alt="wave" />
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
    </motion.div>
  );
}

export default MessagesPage; 