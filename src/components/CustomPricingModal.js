import React, { useEffect } from 'react';
import './CustomPricingModal.css';

export default function CustomPricingModal({ open, onClose, onInquiry, onSubscribe, onCancel }) {
  useEffect(() => {
    const labelDiv = document.getElementById('chart-crosshair-label');
    if (open && labelDiv) {
      labelDiv.style.display = 'none';
    } else if (!open && labelDiv) {
      labelDiv.style.display = '';
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="custom-pricing-modal-overlay" onClick={onClose}>
      <div className="custom-pricing-modal-box" onClick={e => e.stopPropagation()}>
        <button className="custom-pricing-modal-close" onClick={onClose} aria-label="닫기">×</button>
        <h2 className="custom-pricing-modal-title">더 많은 종목을 관리하고 싶으신가요?</h2>
        <p className="custom-pricing-modal-desc">hindsight와 함께 포트폴리오를 한 단계 업그레이드하세요.</p>
        <div className="custom-pricing-modal-cards-row">
          <div className="custom-pricing-card free">
            <div className="custom-pricing-card-title">Free</div>
            <div className="custom-pricing-card-sub">Basic plan</div>
            <div className="custom-pricing-card-detail">최대 2개 종목 관리</div>
            <div className="custom-pricing-card-detail">비주얼 트레이딩 저널</div>
            <div className="custom-pricing-card-detail">기간별 성과 분석</div>
          </div>
          <div className="custom-pricing-card pro">
            <div className="custom-pricing-card-title">$15/mth</div>
            <div className="custom-pricing-card-sub">Pro plan</div>
            <div className="custom-pricing-card-detail">무제한 종목 관리</div>
            <div className="custom-pricing-card-detail">비주얼 트레이딩 저널</div>
            <div className="custom-pricing-card-detail">기간별 성과 분석</div>
            
          </div>
        </div>
        <div className="custom-pricing-modal-divider"></div>
        <div className="custom-pricing-modal-actions-row">
          <div className="custom-pricing-modal-actions-left">
            <button className="custom-pricing-modal-btn inquiry" onClick={onInquiry}>문의하기</button>
          </div>
          <div className="custom-pricing-modal-actions-right">
            <button className="custom-pricing-modal-btn cancel" onClick={onCancel}>괜찮아요</button>
            <button className="custom-pricing-modal-btn subscribe" onClick={onSubscribe}>결제하기</button>
          </div>
        </div>
      </div>
    </div>
  );
} 