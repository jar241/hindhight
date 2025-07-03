// src/KpiCard.js
import React from 'react';
import './KpiCard.css';

function KpiCard({ title, value, change, subtext, variant, changeColor }) {
  const cardClassName = `kpi-card ${variant || ''}`;
  // 등락 컬러 자동 분기: change가 숫자면 부호로, 아니면 neutral
  let autoChangeColor = changeColor;
  if (!changeColor && typeof change === 'string') {
    // +, - 부호로 판별
    if (/^\+/.test(change)) autoChangeColor = 'positive';
    else if (/^-/.test(change)) autoChangeColor = 'negative';
    else autoChangeColor = 'neutral';
  }
  return (
    <div className={cardClassName}>
      <span className="kpi-title">{title}</span>
      {/* value는 string 또는 React node 허용 (예: 거래내역 카드에서 매수/매도/구분점 등) */}
      <span className="kpi-main-value">{value}</span>
      <div className="kpi-sub-wrapper">
        {change && <span className={`kpi-change${autoChangeColor ? ' ' + autoChangeColor : ''}`}>{change}</span>}
        {subtext && <span className="kpi-subtext">{subtext}</span>}
      </div>
    </div>
  );
}

export default KpiCard;