import React from 'react';
import './LandingPage.css';
import Header from './Header';
import { ReactComponent as FileUploadIcon } from './assets/icons/file-upload-icon.svg';
import { ReactComponent as TableSample } from './assets/img/table-sample.svg';
import { ReactComponent as DownloadIcon } from './assets/icons/downlod_icon.svg';
import { ReactComponent as Placeholder } from './assets/img/placeholder.svg';


const steps = [
  {
    number: 1,
    content: <span className="step-title">회원가입 혹은 로그인 후</span>,
  },
  {
    number: 2,
    content: <>
      <span className="step-title">엑셀 템플릿 파일을 다운로드하세요.</span>
      <button className="landing-btn secondary">
        <DownloadIcon className="download-icon" />
        템플릿 다운로드
      </button>
    </>,
  },
  {
    number: 3,
    content: <>
      <span className="step-title">당신의 매매 내역을 입력하세요.</span>
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
        <div className="file-upload-box">
          <span className="file-upload-icon"><FileUploadIcon width={39} height={40} /></span>
          <span className="file-upload-action">파일 업로드</span>
          <span className="file-upload-instructions">파일 선택 혹은 여기로 끌어다 놓으세요</span>
        </div>
      </div>
    </>,
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />
      <div className="landing-root">
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
          <aside className="landing-right-panel">
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
          </aside>
        </main>
      </div>
    </>
  );
} 