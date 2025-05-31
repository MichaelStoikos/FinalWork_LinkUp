import React from 'react';
import { useParams } from 'react-router-dom';
import ChatList from './ChatList';
import Messages from './Messages';
import '../style/MessagesPage.css';

function MessagesPage() {
  const { chatId } = useParams();

  return (
    <div className="messages-page-2col">
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