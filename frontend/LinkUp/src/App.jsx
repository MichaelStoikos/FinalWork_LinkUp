import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home.jsx';
import Trades from './pages/Trades.jsx';
import Profile from './pages/Profile.jsx';
import MyTrades from './pages/MyTrades';
import TradeDetails from './pages/TradeDetails';
import AccountDetails from './pages/AccountDetails';
import MessagesPage from './pages/MessagesPage';
import './style/index.css';
import './style/DeliverablesPanel.css';

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Trades" element={<Trades />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-trades" element={<MyTrades />} />
        <Route path="/trade/:tradeId" element={<TradeDetails />} />
        <Route path="/account/:userId" element={<AccountDetails />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:chatId" element={<MessagesPage />} />
      </Routes>
    </>
  );
}

export default App;
