import React from 'react';
import './Modal.css';

export default function Modal({ open, onClose, title, desc, actions, children }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        {title && <h2 className="modal-title">{title}</h2>}
        {desc && <p className="modal-desc">{desc}</p>}
        {children}
        {actions && (
          <div className="modal-actions">
            {actions.map((action, idx) => (
              <button
                key={idx}
                className={`modal-btn${action.variant ? ' ' + action.variant : ''}`}
                onClick={action.onClick}
                autoFocus={action.autoFocus}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 