import React, { useRef, useState, useEffect } from 'react';
import './LandingPage.css';
import Header from './Header';
import { ReactComponent as FileUploadIcon } from './assets/icons/file-upload-icon.svg';
import { ReactComponent as TableSample } from './assets/img/table-sample.svg';
import { ReactComponent as DownloadIcon } from './assets/icons/downlod_icon.svg';
import { ReactComponent as Placeholder } from './assets/img/placeholder.svg';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Modal from './components/Modal';
import supabase from './supabaseClient';

const MODAL_TITLE = "잠깐만요! 로그인이 필요해요.";
const MODAL_DESC = "이 기능을 사용하려면 로그인이 필요합니다. 계정이 없으시다면 무료로 가입해보세요.";

function handleDownloadTemplate() {
  const data = [
    ["Ticker", "Type", "Date", "Price", "Share", "Journal"],
    ["NKE", "Buy", "2025-06-10", 170.50, 5, ""],
    ["NKE", "Sell", "2025-06-21", 165.50, 2, ""],
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

function FileUploadBox({ onFileUploaded, onRequireAuth }) {
  const inputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleBoxClick = (e) => {
    if (onRequireAuth) {
      onRequireAuth();
      return;
    }
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

// 엑셀 시리얼 날짜를 YYYY-MM-DD 문자열로 변환
function excelDateToString(excelDate) {
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

export default function LandingPage() {
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [redirectPending, setRedirectPending] = useState(true);

  const modalActions = [
    {
      label: '로그인',
      onClick: () => { setModalOpen(false); navigate('/login'); },
    },
    {
      label: '회원가입',
      onClick: () => { setModalOpen(false); navigate('/signup'); },
      variant: 'primary',
      autoFocus: true,
    },
  ];

  // 거래내역 Supabase 업로드 함수 (모든 ticker에 대해 delete → insert)
  async function uploadTradesToSupabase(trades, userId) {
    if (!trades.length) return;
    // ticker별로 그룹핑
    const tickers = [...new Set(trades.map(t => t.ticker))];
    for (const ticker of tickers) {
      await supabase
        .from('trades')
        .delete()
        .eq('user_id', userId)
        .eq('ticker', ticker);
      const tickerTrades = trades.filter(t => t.ticker === ticker);
      if (tickerTrades.length > 0) {
        const { error } = await supabase
          .from('trades')
          .insert(tickerTrades.map(t => ({ ...t, user_id: userId })));
        if (error) throw error;
      }
    }
  }

  // 파일 업로드 후 파싱 및 Supabase 저장
  const handleFileUploaded = async (file) => {
    if (!user) {
      setModalOpen(true);
      return;
    }
    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let trades = XLSX.utils.sheet_to_json(sheet);
      // 컬럼명 통일 및 날짜 변환
      trades = trades.map(t => {
        let dateVal = t.Date || t.date;
        if (typeof dateVal === 'number') {
          dateVal = excelDateToString(dateVal);
        }
        // UTC 기준으로 변환
        let dateUTC = dateVal ? new Date(dateVal + 'T00:00:00Z') : null;
        return {
          ticker: t.Ticker || t.ticker,
          type: (t.Type || t.type || '').toLowerCase(),
          date: dateUTC ? dateUTC.toISOString().slice(0, 10) : '', // YYYY-MM-DD
          price: Number(t.Price || t.price),
          share: Number(t.Share || t.share),
          journal: t.Journal || t.journal || '',
        };
      });
      await uploadTradesToSupabase(trades, user.id);
      setUploaded(true);
      setLoading(false);
      alert('거래내역이 저장되었습니다!');
    } catch (e) {
      setLoading(false);
      alert('업로드 실패: ' + (e.message || e.error_description || ''));
    }
  };

  // 로그인 후 거래 데이터 있으면 대시보드로 이동
  useEffect(() => {
    async function checkAndRedirect() {
      if (authLoading) return; // 아직 인증 확인 중이면 대기
      if (user) {
        setRedirectPending(true);
        const { count, error } = await supabase
          .from('trades')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!error && count > 0) {
          navigate('/dashboard');
        } else {
          setRedirectPending(false);
        }
      } else {
        setRedirectPending(false);
      }
    }
    checkAndRedirect();
  }, [user, authLoading, navigate]);

  if (redirectPending) return null;

  const steps = [
    {
      number: 1,
      content: <span className="step-title">회원가입 혹은 로그인 후</span>,
    },
    {
      number: 2,
      content: <>
        <span className="step-title">엑셀 템플릿 파일을 다운로드하세요.</span>
        <button
          className="landing-btn secondary"
          onClick={e => {
            if (!user && !authLoading) {
              setModalOpen(true);
              return;
            }
            handleDownloadTemplate();
          }}
        >
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
          <FileUploadBox
            onFileUploaded={handleFileUploaded}
            onRequireAuth={!user && !authLoading ? () => setModalOpen(true) : undefined}
          />
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
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={MODAL_TITLE}
          desc={MODAL_DESC}
          actions={modalActions}
        />
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