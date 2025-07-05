import React, { useRef, useState } from 'react';
import './CustomUpdateTradeModal.css';
import fileUploadIconBefore from '../assets/icons/file-upload-icon-before.svg';
import fileUploadIconAfter from '../assets/icons/file-upload-icon-after.svg';

export default function CustomUpdateTradeModal({ open, onClose, ticker, onFileUpload, error, fileName, onConfirm }) {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  const handleBoxClick = () => {
    inputRef.current.click();
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await new Promise(res => setTimeout(res, 1200)); // 테스트용 1.2초 딜레이
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-update-modal-overlay">
      <div className="custom-update-modal-box">
        <button onClick={onClose} className="custom-update-modal-close" aria-label="닫기">×</button>
        <div className="custom-update-modal-title">{ticker} 매매내역을 업데이트하시나요?</div>
        <div className="custom-update-modal-desc">
          업로드 파일로 덮어쓰기 때문에 기존 데이터가 모두 사라져요.<br />
          기존 거래내역이 포함되었는지 꼭 확인해주세요.
        </div>
        <div className={`custom-update-modal-upload-box${error ? ' error' : ''}`}
             onClick={handleBoxClick}
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          <input
            type="file"
            ref={inputRef}
            className="custom-update-modal-file-upload-input"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
          <img
            src={fileName ? fileUploadIconAfter : fileUploadIconBefore}
            alt="파일 업로드"
            className="custom-update-modal-fileicon"
          />
          {fileName ? (
            <div className="custom-update-modal-filename">{fileName}</div>
          ) : (
            <>
              <div className="custom-update-modal-upload-label">파일 업로드</div>
              <div className="custom-update-modal-upload-desc">파일 선택 혹은 여기로 끌어다 놓으세요</div>
            </>
          )}
          {error && (
            <div className="custom-update-modal-upload-desc error">{error}</div>
          )}
        </div>
        <div className="custom-update-modal-actions">
          <button
            onClick={onClose}
            className="custom-update-modal-btn cancel"
            disabled={loading}
          >취소</button>
          <button
            onClick={handleUpdate}
            className="custom-update-modal-btn update"
            disabled={!fileName || !!error || loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? <span className="custom-update-modal-spinner" /> : "업데이트"}
          </button>
        </div>
      </div>
    </div>
  );
} 