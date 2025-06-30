import React, { useState, useEffect } from 'react';
import '../LandingPage.css';
import './SignupPage.css';
import Header from '../Header';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { ReactComponent as Placeholder } from '../assets/img/placeholder.svg';
import googleIcon from '../assets/img/google_icon.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleForgotPassword = () => {
    navigate('/reset-password');
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
            <div className="signup-container">
              <div className="signup-header">
                <div className="signup-title">로그인</div>
                <div className="signup-welcome">다시 만나서 반가워요!</div>
              </div>
              <form onSubmit={handleLogin} className="signup-form">
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
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="forgot-password-link"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !isFormValid}
                  className={`signup-button ${!isFormValid ? 'disabled' : ''}`}
                >
                  로그인하기
                </button>
              </form>
              <button 
                onClick={handleGoogleLogin} 
                disabled={loading} 
                className="google-button"
              >
                <img src={googleIcon} alt="Google" className="google-icon" />
                구글로 로그인하기
              </button>
              {error && <div className="error-message">{error}</div>}
              <div className="login-link-container">
                계정이 없으신가요?{' '}
                <Link to="/signup" className="login-link">회원가입</Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
} 