import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BirdLogo from './BirdLogo';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

interface HeaderProps {
    rightContent?: ReactNode;
}

function Header({ rightContent }: HeaderProps): JSX.Element {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [seenBirds, setSeenBirds] = useState<any[]>([]);
    const [, setError] = useState(false);

    // Fetch seen birds from API
    const fetchSeenBirds = React.useCallback(async () => {
        if (!isLoggedIn) return;
        const userId = localStorage.getItem('userID');
        if (!userId) return;

        try {
            const res = await fetch('/api/get-saved-birds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.error) {
                console.warn('API error:', data.error);
                setError(true);
                return;
            }
            setSeenBirds(data.identfiedBirds || []);
            setError(false);
        } catch (err: any) {
            console.error('Failed to fetch seen birds:', err);
            setError(true);
        }
    }, [isLoggedIn]);

    // Fetch on mount
    useEffect(() => {
        fetchSeenBirds();
    }, [fetchSeenBirds]);

    // Poll for updates every 2 seconds when on Floridex page
    useEffect(() => {
        if (!isLoggedIn || location.pathname !== '/floridex') return;

        const interval = setInterval(() => {
            fetchSeenBirds();
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [isLoggedIn, location.pathname, fetchSeenBirds]);

    const seenCount = seenBirds.length;
    const totalCount = 151;

    // Progress bar width in px
    const progressBarWidth = 400; // Increased for better color discernment
    const progressPercent = Math.min(seenCount / totalCount, 1);

    function handleLogout(): void {
        localStorage.removeItem('userID');
        navigate('/login');
    }

    // Group seen birds by family and count, and collect colors
    const familyMap: Record<string, { count: number; color: string }> = {};
    seenBirds.forEach(bird => {
        if (bird.Family) {
            const fam = bird.Family;
            if (!familyMap[fam]) {
                familyMap[fam] = { count: 0, color: bird.Color || '#4a8c7c' };
            }
            familyMap[fam].count += 1;
        }
    });
    // Alphabetically sorted families
    const sortedFamilies = Object.keys(familyMap).sort();
    // Prepare segments for the colored bar, in family order
    const colorSegments = sortedFamilies.flatMap(family => {
        const { count, color } = familyMap[family];
        // For each bird in this family, add a segment
        return Array(count).fill({ color, family });
    });

    // DEBUG: Log seenBirds and colorSegments for troubleshooting
    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('seenBirds:', seenBirds);
        // eslint-disable-next-line no-console
        console.log('colorSegments:', colorSegments);
    }, [seenBirds]);

    return (
        <header className="site-header">
            <Link to="/landing" className="header-logo" aria-label="Go to the Floridex landing page">
                <BirdLogo />
            </Link>

            <div className="header-center">
                {isLoggedIn ? (
                    <Link to="/floridex" className="header-title-link" aria-label="Go to Floridex bird checklist">
                        <h1 className="header-title">Floridex</h1>
                    </Link>
                ) : (
                    <h1 className="header-title">Floridex</h1>
                )}

                {isLoggedIn && (
                    <>
                        <button className="logout-btn" onClick={handleLogout} aria-label="Log out of Floridex">Logout</button>
                        <div className="header-progress-label">
                            <span className="header-seen-count">{seenCount}</span>/{totalCount}
                        </div>
                        <div className="header-progress-bar" style={{ width: `${progressBarWidth}px`, position: 'relative', height: '20px', background: '#eee', borderRadius: '10px', overflow: 'hidden', margin: '0 auto' }}>
                            {/* Background bar always visible */}
                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPercent * 100}%`, display: 'flex', zIndex: 2, borderRadius: '10px', overflow: 'hidden' }}>
                                {colorSegments.map((segment, idx) => (
                                    <div
                                        key={segment.family + '-' + idx}
                                        style={{
                                            width: `${100 / seenCount}%`,
                                            height: '100%',
                                            background: segment.color,
                                            transition: 'width 0.3s',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="header-right">
                {isLoggedIn ? (
                    location.pathname === '/log-bird' ? (
                        <Link to="/floridex" className="log-bird-btn" aria-label="Return to Floridex bird checklist">
                            Back to Floridex
                        </Link>
                    ) : (
                        <Link to="/log-bird" className="log-bird-btn" aria-label="Open the Log Bird page">
                            Log Bird
                        </Link>
                    )
                ) : (
                    rightContent
                )}
            </div>
        </header>
    );
}

export default Header;

