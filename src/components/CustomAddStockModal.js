import React from 'react';
import './CustomAddStockModal.css';

export default function CustomAddStockModal({ open, onClose, onDownloadTemplate, onUpload }) {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal-box" onClick={e => e.stopPropagation()}>
        <button className="custom-modal-close" onClick={onClose} aria-label="닫기">×</button>
        <h2 className="custom-modal-title">종목을 추가하세요</h2>
        <p className="custom-modal-desc">템플릿 다운로드 후 컬럼에 맞게 거래내역을 채워넣은 후 업로드해주세요.<br />단 무료 플랜에서는 최대 2종목만 입력 가능해요. </p>
        <div className="custom-modal-table-wrapper">
          <table className="custom-modal-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Type</th>
                <th>Date</th>
                <th>Price</th>
                <th>Share</th>
                <th>Journal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NKE</td>
                <td>Buy</td>
                <td>2025-06-10</td>
                <td>$63.50</td>
                <td>5</td>
                <td>떨어진거 같아서 일단 질러봄</td>
              </tr>
              <tr>
                <td>O</td>
                <td>Sell</td>
                <td>2025-06-21</td>
                <td>$61.80</td>
                <td>2</td>
                <td>월세 받는것 같지만 요즘 뒤숭숭</td>
              </tr>
              <tr>
                <td>PLTR</td>
                <td>Buy</td>
                <td>2025-06-21</td>
                <td>$142.80</td>
                <td>2</td>
                <td>더 오를거 같아서 추매</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="custom-modal-actions-row">
          <button className="custom-modal-btn secondary" onClick={onDownloadTemplate}>템플릿 다운로드</button>
          <button className="custom-modal-btn primary" onClick={onUpload}>내 거래내역 업로드</button>
        </div>
      </div>
    </div>
  );
} 