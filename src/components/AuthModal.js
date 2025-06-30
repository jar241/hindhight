import React from 'react';
import './AuthModal.css';

export default function AuthModal({ open, onClose, onGoAuth, title, desc }) {
  if (!open) return null;
  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <h2>{title}</h2>
        <p>{desc}</p>
        <div className="auth-modal-actions">
          <button className="auth-modal-btn primary" onClick={onGoAuth}>로그인/회원가입 하러가기</button>
          <button className="auth-modal-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
} 