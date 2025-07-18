import React, { useState, useEffect } from 'react';
import '../LandingPage.css';
import './SignupPage.css';
import Header from '../Header';
import supabase from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { ReactComponent as Placeholder } from '../assets/img/placeholder.svg';
import googleIcon from '../assets/img/google_icon.png';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  // 폼 유효성 검사
  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '' && name.trim() !== '');
  }, [email, password, name]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/verify-email', { state: { email } });
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <>
      {/* 헤더: 로고만 */}
      <Header hideAuthButtons />
      <div className="landing-root">
        <main className="landing-main">
          {/* 좌측: 랜딩과 동일 */}
          <section className="landing-left-panel">
            <div className="landing-tagline">
              <h1 className="landing-title">Visual Trading Journal</h1>
              <p className="landing-desc">과거의 점과 선이 미래의 인사이트로 전달되는, 차트 위에 펼쳐지는 나의 트레이딩 스토리</p>
            </div>
            <div className="landing-chart-mini">
              <Placeholder />
            </div>
          </section>
          {/* 우측: 회원가입 폼 */}
          <section className="landing-right-panel">
            <div className="signup-container">
              <div className="signup-header">
                <div className="signup-title">회원가입</div>
                <div className="signup-welcome">환영합니다! Hindsight와 함께 더 현명한 투자자로 거듭나세요.</div>
              </div>
              <form onSubmit={handleSignup} className="signup-form">
                <div className="form-group">
                  <label>이름*</label>
                  <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>이메일*</label>
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>비밀번호*</label>
                  <input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !isFormValid} 
                  className={`signup-button ${!isFormValid ? 'disabled' : ''}`}
                >
                  시작하기
                </button>
              </form>
              <button onClick={handleGoogleSignup} disabled={loading} className="google-button">
                <img src={googleIcon} alt="Google" className="google-icon" />
                구글로 시작하기
              </button>
              {error && <div className="error-message">{error}</div>}
              <div className="login-link-container">
                이미 계정이 있나요?{' '}
                <Link to="/login" className="login-link">로그인</Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
} 