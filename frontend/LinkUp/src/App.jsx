import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home.jsx';
import Trades from './pages/Trades.jsx';
import Profile from './pages/Profile.jsx';
import './style/index.css';

function App() {

  return (
    <>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Trades" element={<Trades />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
    </>
  )
}

export default App;
