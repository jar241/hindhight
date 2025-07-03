import React from 'react';
import './Header.css';
import { ReactComponent as Logo } from './assets/logo/logo.svg';
import userIconPng from './assets/img/user_icon.png';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';
import DropdownMenuProfile from './components/DropdownMenuProfile';
import { useState, useRef, useEffect } from 'react';
import Modal from './components/Modal';
import CustomPricingModal from './components/CustomPricingModal';

export default function Header({ hideAuthButtons }) {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef();
  const dropdownRef = useRef();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [stockCount, setStockCount] = useState(0);
  const isPro = false;
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStockCount() {
      if (!user) return;
      const { data, error } = await supabase
        .from('trades')
        .select('ticker')
        .eq('user_id', user.id);
      if (!error && data) {
        const uniqueTickers = Array.from(new Set(data.map(t => t.ticker)));
        setStockCount(uniqueTickers.length);
      }
    }
    fetchStockCount();
  }, [user]);

  // 외부 클릭 시 닫힘
  useEffect(() => {
    function handleClick(e) {
      if (
        profileOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  const handleProfileBtnClick = () => setProfileOpen(v => !v);
  const handleLogout = () => {
    setProfileOpen(false);
    setLogoutModalOpen(true);
  };
  const handleLogoutConfirm = async () => {
    setLogoutModalOpen(false);
    await supabase.auth.signOut();
    // navigate('/'); // 필요시 홈으로 이동
  };
  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };
  const handleSettings = () => {
    setProfileOpen(false);
    // navigate('/settings'); // 필요시 설정 페이지 이동
  };
  const handleUpgrade = () => {
    setProfileOpen(false);
    setPricingModalOpen(true);
  };

  return (
    <header className="header">
      <div className="header-logo" onClick={() => navigate('/') } style={{ cursor: 'pointer' }}>
        <Logo className="header-logo-svg" />
      </div>
      <div className="header-auth-buttons">
        {hideAuthButtons ? null : (
          authLoading ? null : user ? (
            <>
              <button
                className="header-btn profile"
                onClick={handleProfileBtnClick}
                title={user?.email || ''}
                ref={profileBtnRef}
              >
                <img src={userIconPng} alt="profile" style={{ width: 24, height: 24, objectFit: 'cover' }} />
              </button>
              {profileOpen && (
                <div ref={dropdownRef} style={{position:'absolute',top:56,right:16,zIndex:20000}}>
                  <DropdownMenuProfile
                    name={user.user_metadata?.name || '이름'}
                    email={user?.email || ''}
                    avatarUrl={user.user_metadata?.avatar_url || userIconPng}
                    stockCount={stockCount}
                    isPro={isPro}
                    onSettings={handleSettings}
                    onUpgrade={handleUpgrade}
                    onLogout={handleLogout}
                  />
                </div>
              )}
              <CustomPricingModal
                open={pricingModalOpen}
                onClose={() => setPricingModalOpen(false)}
                onInquiry={() => { window.open('mailto:support@hindsight.com'); setPricingModalOpen(false); }}
                onSubscribe={() => { setPricingModalOpen(false); }}
                onCancel={() => setPricingModalOpen(false)}
              />
            </>
          ) : (
            <>
              <Link to="/login"><button className="header-btn login">로그인</button></Link>
              <Link to="/signup"><button className="header-btn signup">회원가입</button></Link>
            </>
          )
        )}
      </div>
      <Modal
        open={logoutModalOpen}
        onClose={handleLogoutCancel}
        title="정말 로그아웃하시나요?"
        desc={`hindsight에서 ${user?.email || ''} 계정을 로그아웃하시겠습니까?`}
        actions={[
          { label: '취소', onClick: handleLogoutCancel },
          { label: '로그아웃', onClick: handleLogoutConfirm, variant: 'primary' }
        ]}
      />
    </header>
  );
} 