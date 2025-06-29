import React from 'react';
import './Header.css';
import { ReactComponent as Logo } from './assets/logo/logo.svg';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Logo className="header-logo-svg" />
      </div>
      <div className="header-auth-buttons">
        <button className="header-btn login">Log in</button>
        <button className="header-btn signup">Sign up</button>
      </div>
    </header>
  );
} 