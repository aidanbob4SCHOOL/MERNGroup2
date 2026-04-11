import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BirdLogo from './BirdLogo';
import './Header.css';

interface HeaderProps {
  rightContent?: ReactNode;
}

function Header({ rightContent }: HeaderProps): JSX.Element {
  return (
    <header className="site-header">
      <Link to="/landing" className="header-logo">
        <BirdLogo />
      </Link>
      <h1 className="header-title">Floridex</h1>
      <div className="header-right">
        {rightContent}
      </div>
    </header>
  );
}

export default Header;
