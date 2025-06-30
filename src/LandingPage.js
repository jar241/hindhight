import React, { useRef, useState } from 'react';
import './LandingPage.css';
import Header from './Header';
import { ReactComponent as FileUploadIcon } from './assets/icons/file-upload-icon.svg';
import { ReactComponent as TableSample } from './assets/img/table-sample.svg';
import { ReactComponent as DownloadIcon } from './assets/icons/downlod_icon.svg';
import { ReactComponent as Placeholder } from './assets/img/placeholder.svg';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

function handleDownloadTemplate() {
  const data = [
    ["Ticker", "Type", "Date", "Price", "Share"],
    ["NKE", "Buy", "2025-06-10", 170.50, 5],
    ["NKE", "Sell", "2025-06-21", 165.50, 2],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trades");
  XLSX.writeFile(wb, "trade_template.xlsx");
}

function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <div className="loading-message">차트 생성 중입니다...</div>
    </div>
  );
}

function FileUploadBox({ onFileUploaded }) {
  const inputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleBoxClick = () => {
    inputRef.current.click();
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      onFileUploaded && onFileUploaded(e.target.files[0]);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
      onFileUploaded && onFileUploaded(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`file-upload-box${dragActive ? ' drag-active' : ''}`}
      onClick={handleBoxClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
      />
      <span className="file-upload-icon"><FileUploadIcon width={39} height={40} /></span>
      <span className="file-upload-action">파일 업로드</span>
      <span className="file-upload-instructions">파일 선택 혹은 여기로 끌어다 놓으세요</span>
      {fileName && <div className="file-upload-filename">{fileName}</div>}
    </div>
  );
}

export default function LandingPage() {
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      content: <span className="step-title">회원가입 혹은 로그인 후</span>,
    },
    {
      number: 2,
      content: <>
        <span className="step-title">엑셀 템플릿 파일을 다운로드하세요.</span>
        <button className="landing-btn secondary" onClick={handleDownloadTemplate}>
          <DownloadIcon className="download-icon" />
          템플릿 다운로드
        </button>
      </>,
    },
    {
      number: 3,
      content: <>
        <span className="step-title">파일에 당신의 매매 내역을 입력하세요.</span>
        <div className="landing-table-sample">
          <TableSample style={{ width: '100%', height: '100%' }} />
        </div>
      </>,
    },
    {
      number: 4,
      content: <>
        <span className="step-title">작성한 파일을 업로드하고 차트를 확인하세요.</span>
        <div className="landing-file-upload">
          <FileUploadBox onFileUploaded={() => setUploaded(true)} />
          <button
            className="landing-btn cta"
            disabled={!uploaded || loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                navigate('/dashboard');
              }, 1200);
            }}
          >
            차트 만들기
          </button>
        </div>
      </>,
    },
  ];

  return (
    <>
      <Header />
      <div className="landing-root">
        {loading && <LoadingOverlay />}
        <main className="landing-main">
          <section className="landing-left-panel">
            <div className="landing-tagline">
              <h1 className="landing-title">Visual Trading Journal</h1>
              <p className="landing-desc">과거의 점과 선이 미래의 인사이트로 전달되는, 차트 위에 펼쳐지는 나의 트레이딩 스토리</p>
            </div>
            <div className="landing-chart-mini">
              <Placeholder />
            </div>
          </section>
          <section className="landing-right-panel">
            <ol className="landing-steps">
              {steps.map((step, idx) => (
                <li className="landing-step" key={step.number}>
                  <div className="step-indicator">
                    <span className="step-number">{step.number}</span>
                    {idx !== steps.length - 1 && <span className="step-divider" />}
                  </div>
                  <div className="step-content">{step.content}</div>
                </li>
              ))}
            </ol>
          </section>
        </main>
      </div>
    </>
  );
} 