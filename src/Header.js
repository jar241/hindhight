import React from 'react';
import './Header.css';
import { ReactComponent as Logo } from './assets/logo/logo.svg';
import userIconPng from './assets/img/user_icon.png';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Header({ hideAuthButtons }) {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      // 필요시 홈으로 이동
      // navigate('/');
    }
  };

  return (
    <header className="header">
      <div className="header-logo" onClick={() => navigate('/') } style={{ cursor: 'pointer' }}>
        <Logo className="header-logo-svg" />
      </div>
      <div className="header-auth-buttons">
        {hideAuthButtons ? null : (
          authLoading ? null : user ? (
            <button className="header-btn profile" onClick={handleProfileClick} title={user.email}>
              <img src={userIconPng} alt="profile" style={{ width: 24, height: 24, objectFit: 'cover' }} />
            </button>
          ) : (
            <>
              <Link to="/login"><button className="header-btn login">로그인</button></Link>
              <Link to="/signup"><button className="header-btn signup">회원가입</button></Link>
            </>
          )
        )}
      </div>
    </header>
  );
} 