import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BirdLogo from './BirdLogo';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

interface HeaderProps {
    rightContent?: ReactNode;
}

function Header({ rightContent }: HeaderProps): JSX.Element {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    // replace seen with data from api
    const seenCount  = 0;
    const totalCount = 151;

    function handleLogout(): void {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <header className="site-header">
            <Link to="/landing" className="header-logo">
                <BirdLogo />
            </Link>

            <div className="header-center">
                <h1 className="header-title">Floridex</h1>

                {isLoggedIn && (
                    <>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                        <div className="header-progress-label">
                            <span className="header-seen-count">{seenCount}</span>/{totalCount}
                        </div>
                        <div className="header-progress-bar">
                            <div
                                className="header-progress-fill"
                                style={{ width: `${(seenCount / totalCount) * 100}%` }}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="header-right">
                {isLoggedIn ? (
                    <Link to="/floridex" className="log-bird-btn">
                        Log Bird
                    </Link>
                ) : (
                    rightContent
                )}
            </div>
        </header>
    );
}

export default Header;