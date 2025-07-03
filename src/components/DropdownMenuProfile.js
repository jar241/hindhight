import React from 'react';
import './DropdownMenuProfile.css';
import settingsIcon from '../assets/icons/settings_icon.svg';
import zapIcon from '../assets/icons/zap_icon.svg';
import { ReactComponent as LogoutIcon } from '../assets/icons/logout_icon.svg';

// Example usage:
// <DropdownMenuProfile name="홍길동" email="abc@email.com" avatarUrl="..." onSettings={...} onUpgrade={...} onLogout={...} />

const DropdownMenuProfile = ({ name, email, avatarUrl, stockCount = 0, isPro = false, onSettings, onUpgrade, onManagePlan, onLogout }) => {
  return (
    <div className="dropdown-profile-root">
      <div className="dropdown-profile-header">
        <div className="dropdown-profile-userinfo">
          <div className="dropdown-profile-name">{name}</div>
          <div className="dropdown-profile-email">{email}</div>
        </div>
      </div>
      {/* 중간 구독/종목 카드 영역 - Figma 스타일 */}
      <div className="dropdown-profile-subscription-card">
        {isPro ? (
          <>
            <div className="dropdown-profile-plan-row">
              <span className="dropdown-profile-plan-pro">유료 구독중</span>
              <span className="dropdown-profile-plan-count">{stockCount} 종목</span>
            </div>
            {/*<button className="dropdown-profile-manage-btn" onClick={onManagePlan}>플랜 관리</button>*/}
          </>
        ) : (
          <>
            <div className="dropdown-profile-plan-row">
              <span className="dropdown-profile-plan-free">무료</span>
              <span className="dropdown-profile-plan-count">{stockCount}/2 종목</span>
            </div>
            <button className="dropdown-profile-upgrade-btn" onClick={onUpgrade}>업그레이드 플랜</button>
          </>
        )}
      </div>
      <div className="dropdown-profile-menu">
        {/*
        <button className="dropdown-profile-item" onClick={onSettings}>
          <img src={settingsIcon} alt="설정" className="dropdown-profile-icon" />
          <span>설정</span>
        </button>
        */}
        <div className="dropdown-profile-divider" />
        <button className="dropdown-profile-item" onClick={onLogout}>
          <LogoutIcon className="dropdown-profile-icon" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default DropdownMenuProfile; 