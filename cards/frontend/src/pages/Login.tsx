import React, {useState, useRef, useEffect} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InfoPanel from '../components/InfoPanel';
import { PanelState, PanelType } from '../types/panel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css';
import {Link} from "react-router-dom";

function EyeOpen(): JSX.Element {
  return (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </>
  );
}

function EyeClosed(): JSX.Element {
  return (
    <>
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <path d="M6.53 6.53A13.5 13.5 0 0 0 1 12s4 8 11 8a9.12 9.12 0 0 0 4.76-1.34"/>
      <path d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818"/>
    </>
  );
}

function Login(): JSX.Element {
  //auto redirect if logged in
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/floridex', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const [isSignup, setIsSignup]         = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [panel, setPanel]               = useState<PanelState>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const emailRef    = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function showPanel(type: PanelType, title: string, message: string): void {
    setPanel({ visible: true, type, title, message });
  }

  function hidePanel(): void {
    setPanel((p: PanelState) => ({ ...p, visible: false }));
  }

  function handleToggle(): void {
    setIsSignup((prev: boolean) => !prev);
    hidePanel();
  }

  async function handleSubmit(): Promise<void> {
    if(isSignup){
      doSignup();
    }else{
      doLogin();
    }
  }

  async function doSignup(): Promise<void> {
    const email = emailRef.current?.value.trim() ?? '';
    const login = usernameRef.current?.value.trim() ?? '';
    const password = passwordRef.current?.value.trim() ?? '';

    if (!email || !login || !password) {
      showPanel('error', 'Error', 'Please fill in all fields.');
      return;
    }

    hidePanel()

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showPanel('success', 'Success', `Please check your email for verification.`);
        // then navigate to another page, e.g.:
        // navigate('/home');
      } else {
        showPanel('error', 'Error', data.error ?? 'Something went wrong, please try again.');
      }
    } catch (err) {
      showPanel('warning', 'Warning', 'Network error. Please try again.');
    }
  }

  async function doLogin(): Promise<void> {
    const login = usernameRef.current?.value.trim() ?? '';
    const password = passwordRef.current?.value.trim() ?? '';

    if (!login || !password) {
      showPanel('error', 'Error', 'Please enter both a username/email and password.');
      return;
    }

    hidePanel()

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showPanel('success', 'Success', `Welcome!`);
        // save the token so you stay logged in
        localStorage.setItem('userID', data.id);
        // then navigate to another page, e.g.:
        navigate('/floridex');
      } else {
        showPanel('error', 'Error', data.error ?? 'Wrong username or password.');
      }
    } catch (err) {
      showPanel('warning', 'Warning', 'Network error. Please try again.');
    }
  }

  return (
    <div className="page">
      <Header />

      <main className="login-main">
        <div className="stage">
          <div className="egg-wrap">
            <div className="egg-stack">
              <img src="images/egg.png" alt="egg" className="egg-img" />

              <div className="form-panel">
                <div className="form-title">{isSignup ? 'Sign Up' : 'Login'}</div>

                {isSignup && (
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="email"
                    autoComplete="email"
                    className="form-input"
                  />
                )}

                <input
                  ref={usernameRef}
                  type="text"
                  placeholder={isSignup ? 'username' : 'username/email'}
                  autoComplete="username"
                  className="form-input"
                />

                <div className="password-wrap">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password"
                    autoComplete="current-password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword((prev: boolean) => !prev)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {showPassword ? <EyeClosed /> : <EyeOpen />}
                    </svg>
                  </button>
                </div>

                <button className="submit-btn" onClick={handleSubmit}>
                  {isSignup ? 'Sign Up' : 'Login'}
                </button>
              </div>
            </div>

            <span className="toggle-link" onClick={handleToggle}>
              {isSignup ? 'Back to Login' : 'New to Floridex? Sign up here'}
            </span>
            <Link to="/forgot-password" className="toggle-link">Forgot Password?</Link>
          </div>

          <InfoPanel
            type={panel.type}
            title={panel.title}
            message={panel.message}
            visible={panel.visible}
            onClose={hidePanel}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;
