import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Menu from './components/Menu';
import Explore from './components/Explore';
import MyProfile from './components/MyProfile';


function App() {

  return (
    <Router>
      <div className="min-h-screen bg-background text-text dark">
        <div className="grid grid-cols-12 gap-10 mx-8">
          <div className="col-span-2 fixed h-screen">
            <Menu/>
          </div>
          <div className="col-span-10 col-start-3">
            <Routes>
              <Route path="/explore" element={<Explore />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/" element={<Navigate to="/explore" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;