import React, { useState, useEffect } from 'react';
import { Slide } from '../types/slideshow';
import './Slideshow.css';

const slides: Slide[] = [
    { name: 'Northern Mockingbird', bg: '#b8d4c4', image: 'images/Northern-Mockingbird.jpg' },
    { name: 'Florida Scrub-Jay', bg: '#c4d4b8', image: 'images/Florida-Scrub-Jay.jpg' },
    { name: 'Great Blue Heron',    bg: '#d4e4d0', image: 'images/Great-Blue-Heron.jpg' },
];

function Slideshow(): JSX.Element {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev: number) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  function goToSlide(n: number): void {
    setCurrent(n);
  }

  return (
    <div className="slideshow-wrap">
      <div className="slideshow">
        {slides.map((slide: Slide, i: number) => (
          <div
            key={i}
            className={`slide ${i === current ? 'active' : ''}`}
            style={{ background: slide.bg }}
          >
              <img
                  src={slide.image}
                  alt={slide.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="slideshow-label">{slide.name}</div>
          </div>
        ))}
      </div>

      <div className="slide-dots">
        {slides.map((_: Slide, i: number) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default Slideshow;
