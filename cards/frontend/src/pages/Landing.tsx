import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Slideshow from '../components/Slideshow';
import './Landing.css';

function Landing(): JSX.Element {
  return (
    <div className="page">
      <Header rightContent={<Link to="/login">Login/Logout</Link>} />

      <main className="landing-main">
        <div className="landing-text">
          <h2 className="welcome-title">Welcome!</h2>
          <p className="landing-description">
            Some description about our app. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
            ex ea commodo consequat.
          </p>
          <Link to="/login" className="get-started-btn">Get Started</Link>
        </div>

        <Slideshow />
      </main>

      <Footer />
    </div>
  );
}

export default Landing;
