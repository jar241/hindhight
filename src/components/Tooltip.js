import React, { useState, useRef } from 'react';

export default function Tooltip({ content, children, style }) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef();

  return (
    <span
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block', ...(style || {}) }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span
        style={{
          visibility: visible ? 'visible' : 'hidden',
          opacity: visible ? 1 : 0,
          position: 'absolute',
          left: '50%',
          bottom: '120%',
          transform: 'translateX(-50%)',
          background: '#000',
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          padding: '8px 14px',
          borderRadius: 8,
          /* boxShadow: '0 4px 16px rgba(0,0,0,0.13)',*/
          zIndex: 2000,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          transition: 'opacity 0.18s cubic-bezier(.4,0,.2,1)',
        }}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
} 