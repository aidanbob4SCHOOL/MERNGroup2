import { useState, useEffect } from 'react';

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return !!localStorage.getItem('userID');
    });

    useEffect(() => {
        const userId = localStorage.getItem('userID');
        setIsLoggedIn(!!userId);
    }, []);

    return { isLoggedIn };
}