import React, { useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InfoPanel from '../components/InfoPanel';
import { PanelState, PanelType } from '../types/panel';
import './ResetPassword.css';

function ResetPassword(): JSX.Element {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const passwordRef  = useRef<HTMLInputElement>(null);
    const confirmRef   = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirm, setShowConfirm]   = useState<boolean>(false);
    const [submitted, setSubmitted]       = useState<boolean>(false);
    const [panel, setPanel] = useState<PanelState>({
        visible: false,
        type: 'error',
        title: '',
        message: '',
    });

    function showPanel(type: PanelType, title: string, message: string): void {
        setPanel({ visible: true, type, title, message });
    }

    function hidePanel(): void {
        setPanel((p: PanelState) => ({ ...p, visible: false }));
    }

    async function handleSubmit(): Promise<void> {
        const password = passwordRef.current?.value.trim() ?? '';
        const confirm  = confirmRef.current?.value.trim() ?? '';

        if (!token) {
            showPanel('error', 'Error', 'Invalid or missing reset token. Please request a new reset link.');
            return;
        }
        if (!password) {
            showPanel('error', 'Error', 'Please enter a new password.');
            return;
        }
        if (password.length < 8) {
            showPanel('error', 'Error', 'Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            showPanel('error', 'Error', 'Passwords do not match.');
            return;
        }

        /*
          try {
            const response = await fetch('https://springucfpoosdap.com/api/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password }),
            });
            const data = await response.json();
            if (response.ok) {
              setSubmitted(true);
            } else {
              showPanel('error', 'Error', data.message ?? 'Reset failed. Your link may have expired.');
            }
          } catch (err) {
            showPanel('warning', 'Warning', 'Network error. Please try again.');
          }
        */
    }

    const EyeOpen = () => (
        <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </>
    );

    const EyeClosed = () => (
        <>
            <line x1="17.94" y1="17.94" x2="23" y2="23"/>
            <line x1="1" y1="1" x2="6.06" y2="6.06"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M6.53 6.53A13.5 13.5 0 0 0 1 12s4 8 11 8a9.12 9.12 0 0 0 4.76-1.34"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </>
    );

    const EyeToggle = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
        <button type="button" className="reset-eye-btn" onClick={onClick}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px" height="24px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {show ? <EyeClosed /> : <EyeOpen />}
            </svg>
        </button>
    );

    return (
        <div className="page">
            <Header />

            <main className="reset-main">
                <div className="reset-card">
                    {submitted ? (
                        <>
                            <div className="reset-success-icon">✓</div>
                            <h2 className="reset-title">Password Reset!</h2>
                            <p className="reset-description">Your password has been updated successfully.</p>
                            <Link to="/login" className="reset-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
                                Back to Login
                            </Link>
                        </>
                    ) : (
                        <>
                            <h2 className="reset-title">Reset Password</h2>
                            <p className="reset-description">Enter your new password below.</p>

                            {!token && (
                                <p className="reset-token-warning">
                                    No reset token found. Please use the link from your email.
                                </p>
                            )}

                            <div className="reset-input-wrap">
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="new password"
                                    autoComplete="new-password"
                                    className="reset-input"
                                />
                                <EyeToggle show={showPassword} onClick={() => setShowPassword((p) => !p)} />
                            </div>

                            <div className="reset-input-wrap">
                                <input
                                    ref={confirmRef}
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="confirm new password"
                                    autoComplete="new-password"
                                    className="reset-input"
                                />
                                <EyeToggle show={showConfirm} onClick={() => setShowConfirm((p) => !p)} />
                            </div>

                            <button className="reset-btn" onClick={handleSubmit} disabled={!token}>
                                Reset Password
                            </button>

                            <Link to="/login" className="back-link">Back to Login</Link>
                        </>
                    )}
                </div>

                <InfoPanel
                    type={panel.type}
                    title={panel.title}
                    message={panel.message}
                    visible={panel.visible}
                    onClose={hidePanel}
                />
            </main>

            <Footer />
        </div>
    );
}

export default ResetPassword;