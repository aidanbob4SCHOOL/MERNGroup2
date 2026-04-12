import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './VerifyEmail.css';

type Status = 'loading' | 'success' | 'error';

function VerifyEmail(): JSX.Element {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState<string>('');
    const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found. Please use the link from your email.');
            return;
        }


        async function verify() {
            try {
              const response = await fetch('/api/verify-email?token=${encodeURIComponent(token)}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              const data = await response.json();
              if (response.ok) {
                localStorage.setItem('userID', data.id);
                setStatus('success');
                setTimeout(() => navigate('/floridex'), 3000);
              } else {
                setStatus('error');
                setMessage(data.error ?? 'Verification failed. Your link may have expired.');
              }
            } catch (err) {
              setStatus('error');
              setMessage('Network error. Please try again.');
            }
        }
        verify();
    }, [token, navigate]);

    async function handleResend(): Promise<void> {
        const identifier = localStorage.getItem('pendingVerificationIdentifier') ?? '';

        if (!identifier) {
            setResendState('error');
            return;
        }

        setResendState('sending');

        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem('pendingVerificationIdentifier');
                setResendState('sent');
            } else {
                setResendState('error');
                setMessage(data.error ?? 'Failed to resend email.');
            }
        } catch (err) {
            setResendState('error');
        }
    }

    return (
        <div className="page">
            <Header />

            <main className="verify-main">
                <div className="verify-card">

                    {status === 'loading' && (
                        <>
                            <div className="verify-spinner" />
                            <h2 className="verify-title">Verifying your email...</h2>
                            <p className="verify-description">Please wait a moment.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="verify-icon success">✓</div>
                            <h2 className="verify-title">Email Verified!</h2>
                            <p className="verify-description">
                                Your account has been verified. You're being logged in and redirected automatically...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="verify-icon error">!</div>
                            <h2 className="verify-title">Verification Failed</h2>
                            <p className="verify-description">{message}</p>

                            {resendState === 'sent' ? (
                                <p className="verify-resend-success">
                                    A new verification email has been sent. Please check your inbox.
                                </p>
                            ) : (
                                <button
                                    className="verify-btn"
                                    onClick={handleResend}
                                    disabled={resendState === 'sending'}
                                >
                                    {resendState === 'sending' ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                            )}

                            {resendState === 'error' && (
                                <p className="verify-resend-error">
                                    Could not resend email. Please go back to login and try again.
                                </p>
                            )}

                            <Link to="/login" className="back-link">Back to Login</Link>
                        </>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}

export default VerifyEmail;