// src/KpiCard.js
import React from 'react';
import './KpiCard.css';

function KpiCard({ title, value, change, subtext, variant, changeColor }) {
  const cardClassName = `kpi-card ${variant || ''}`;
  // 중립 컬러 처리
  const changeStyle = changeColor === 'neutral' ? { color: 'var(--color-text-primary)' } : undefined;
  return (
    <div className={cardClassName}>
      <span className="kpi-title">{title}</span>
      <span className="kpi-main-value">{value}</span>
      <div className="kpi-sub-wrapper">
        {change && <span className={`kpi-change${changeColor ? ' ' + changeColor : ''}`}>{change}</span>}
        {subtext && <span className="kpi-subtext">{subtext}</span>}
      </div>
    </div>
  );
}

export default KpiCard;