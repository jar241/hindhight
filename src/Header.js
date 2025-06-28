import React, { useState } from 'react';
import './Header.css';
import { ReactComponent as SunIcon } from './assets/icons/sun.svg';
import { ReactComponent as MoonIcon } from './assets/icons/moon.svg';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <header className="header">
      <div className="logo">
      Hindsight
      </div>
      <div className="theme-toggle">
        <button 
          className={`theme-button ${!isDarkMode ? 'active' : ''}`} 
          onClick={() => setIsDarkMode(false)}
        >
          <SunIcon />
        </button>
        <button 
          className={`theme-button ${isDarkMode ? 'active' : ''}`} 
          onClick={() => setIsDarkMode(true)}
        >
          <MoonIcon />
        </button>
      </div>
    </header>
  );
};

export default Header; 