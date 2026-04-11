import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InfoPanel from '../components/InfoPanel';
import { PanelState, PanelType } from '../types/panel';
import './ForgotPassword.css';

function ForgotPassword(): JSX.Element {
    const identifierRef = useRef<HTMLInputElement>(null);
    const [panel, setPanel] = useState<PanelState>({
        visible: false,
        type: 'info',
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
        const identifier = identifierRef.current?.value.trim() ?? '';

        if (!identifier) {
            showPanel('error', 'Error', 'Please enter your username or email.');
            return;
        }

        /*
          fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier }),
          });
        */
    }

    return (
        <div className="page">
            <Header />

            <main className="forgot-main">
                <div className="forgot-card">
                    <h2 className="forgot-title">Forgot Password</h2>
                    <p className="forgot-description">
                        Enter your username or email and we'll send you a link to reset your password.
                    </p>

                    <input
                        ref={identifierRef}
                        type="text"
                        placeholder="username or email"
                        autoComplete="username"
                        className="forgot-input"
                    />

                    <button className="forgot-btn" onClick={handleSubmit}>
                        Send Reset Link
                    </button>

                    <Link to="/login" className="back-link">Back to Login</Link>
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

export default ForgotPassword;