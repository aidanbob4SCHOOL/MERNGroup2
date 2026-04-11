import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Slideshow from '../components/Slideshow';
import { useAuth } from '../hooks/useAuth';
import './Landing.css';

function Landing(): JSX.Element {
    const { isLoggedIn } = useAuth();

  return (
    <div className="page">
      <Header rightContent={<Link to="/login">Login</Link>} />

      <main className="landing-main">
        <div className="landing-text">
          <h2 className="welcome-title">Welcome!</h2>
          <p className="landing-description">
            Some description about our app. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
            ex ea commodo consequat.
          </p>

            {isLoggedIn ? (
                <Link to="/floridex" className="get-started-btn">To the Floridex</Link>
            ) : (
                <Link to="/login" className="get-started-btn">Get Started</Link>
            )}
        </div>

        <Slideshow />
      </main>

      <Footer />
    </div>
  );
}

export default Landing;
