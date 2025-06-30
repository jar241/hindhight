import React from 'react';
import '../LandingPage.css';
import './SignupPage.css';
import './EmailVerificationPage.css';
import Header from '../Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactComponent as Placeholder } from '../assets/img/placeholder.svg';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'abc@email.com';

  const handleResendEmail = () => {
    // TODO: Implement resend email logic
  };

  const handleChangeEmail = () => {
    navigate('/signup');
  };

  return (
    <>
      <Header hideAuthButtons />
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
          <section className="landing-right-panel">
            <div className="verification-container">
              <div className="verification-content">
                <h2 className="verification-title">
                  <span className="email-highlight">{email}</span>로<br />
                  전송한 인증 메일을 확인하세요
                </h2>
                <p className="verification-desc">
                  스팸함에서도 인증 메일을 발견할 수 없다면 재발송하세요
                </p>
                <button onClick={handleResendEmail} className="verification-button">
                  재발송
                </button>
                <button onClick={handleChangeEmail} className="verification-button secondary">
                  다른 메일 주소 입력
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
} 