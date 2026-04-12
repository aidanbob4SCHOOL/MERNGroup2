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
        {isLoggedIn ? (
            <Header/>
        ) : (
            <Header rightContent={<Link to="/login">Login</Link>} />
        )}
      <main className="landing-main">
        <div className="landing-text">
          <h2 className="welcome-title">Welcome!</h2>
          <p className="landing-description">
              Floridex is the spot for all of those wildlife lovers to challenge their adventurous side. Whether you are a birder and can spot any bird from just its sound, or a casual nature enjoyer that struggles to discern the difference between a gull and a heron, this app provides avenues for all to complete this challenge. Utilizing our ai BirdBrain you are able to upload any photos you have taken and it will tell you what bird species is in the photo. Or if you are confident in your identifying skills you can cutout the middle man and log the bird yourself. Whatever your story is, Floridex will help you expand your travels and add another chapter to your wildlife experience.
            <br/>
              <br/>
              As we say in Florida, "Where there's a bird, there's a bird."
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
