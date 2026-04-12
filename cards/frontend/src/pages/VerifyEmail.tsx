import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './VerifyEmail.css';

type Status = 'loading' | 'success' | 'error';

function VerifyEmail(): JSX.Element {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found. Please use the link from your email.');
            return;
        }


        async function verify() {
            try {
              const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
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
                            <button className="verify-btn" onClick={() => navigate('/login')}>
                                Back to Login
                            </button>
                        </>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}

export default VerifyEmail;