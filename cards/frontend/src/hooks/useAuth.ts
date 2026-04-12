import { useState, useEffect } from 'react';

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        const id = localStorage.getItem('userID');
        setIsLoggedIn(!!id);
    }, []);

    return { isLoggedIn };
}