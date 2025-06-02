import React from 'react';
import { useParams } from 'react-router-dom';
import ChatList from './ChatList';
import Messages from './Messages';
import '../style/MessagesPage.css';

function MessagesPage() {
  const { chatId } = useParams();

  return (
    <div className="messages-page-2col">
      <img className="trades-page-bg" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.gif?alt=media&token=594e9ca5-3bc6-49c4-8a75-bc782e628545" alt="wave" />
      <div className="messages-sidebar">
        <ChatList />
      </div>
      <div className="messages-main">
        {chatId ? (
          <Messages />
        ) : (
          <div className="messages-placeholder">
            <h2>Select a chat to start messaging</h2>
            <p>Your conversations will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage; 