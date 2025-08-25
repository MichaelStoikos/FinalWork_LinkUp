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
import Deliverables from './pages/Deliverables';
import Tutorial from './pages/Tutorial';
import './style/index.css';
import './style/DeliverablesPanel.css';
import { ToastProvider } from './components/ToastContext';
import './style/Toast.css';

function App() {
  return (
    <ToastProvider>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/swaps" element={<Trades />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-trades" element={<MyTrades />} />
        <Route path="/trade/:tradeId" element={<TradeDetails />} />
        <Route path="/account/:userId" element={<AccountDetails />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:chatId" element={<MessagesPage />} />
        <Route path="/deliverables/:chatId" element={<Deliverables />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
