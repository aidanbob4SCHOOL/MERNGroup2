import { useState, useEffect } from 'react';

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    return { isLoggedIn };
}