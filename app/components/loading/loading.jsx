import { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import styles from './loading.module.css';

// Simple marquee component with responsive speed control
const Marquee = ({ children, speed = 50 }) => {
  const [windowWidth, setWindowWidth] = useState(1200); // Always start with 1200 for SSR
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAdjustedSpeed = () => {
    if (!isHydrated) return speed; // Use default speed during SSR
    if (windowWidth >= 1200) return speed;
    if (windowWidth >= 768) return speed * 2;
    if (windowWidth >= 480) return speed * 3;
    return speed * 4;
  };

  const adjustedSpeed = getAdjustedSpeed();

  return (
    <div
      style={{
        display: 'flex',
        animation: `marqueeSimple ${adjustedSpeed}s linear infinite`,
        whiteSpace: 'nowrap',
        width: '200%',
      }}
    >
      <div style={{ width: '50%', flexShrink: 0 }}>{children}</div>
      <div style={{ width: '50%', flexShrink: 0 }}>{children}</div>
    </div>
  );
};

const marqueeStyle = `
  @keyframes marqueeSimple {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
`;

export const Loading = ({ percent = 0, onComplete }) => {
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Add marquee styles to document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = marqueeStyle;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (percent >= 100) {
    setTimeout(() => {
      setLoaded(true);
      setTimeout(() => {
        setIsLoaded(true);
      }, 800);
    }, 400);
  }

  useEffect(() => {
    if (isLoaded) {
      setClicked(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 900);
    }
  }, [isLoaded, onComplete]);

  function handleMouseMove(e) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
  }

  return (
    <>
      <style>{marqueeStyle}</style>

      <div className={styles.loadingScreen}>
        <div className={styles.loadingMarquee}>
          <Marquee speed={15}>
            <span> Welcome To My Portfolio </span>
          </Marquee>
        </div>
        <div className={styles.loadingContentWrapper}>
          <div
            className={`${styles.loadingWrap} ${clicked ? styles.loadingClicked : ''}`}
            onMouseMove={handleMouseMove}
          >
            <div className={styles.loadingHover}></div>
            <div
              className={`${styles.loadingButton} ${
                loaded ? styles.loadingComplete : ''
              }`}
            >
              <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                  <div className={styles.loadingContentIn}>
                    Loading <span>{percent}%</span>
                  </div>
                </div>
                <div className={styles.loadingBox}></div>
              </div>
              <div className={styles.loadingContent2}>
                <span>Welcome</span>
              </div>
            </div>
          </div>
          <div
            className={`${styles.loaderGameContainer} ${clicked ? styles.loaderOut : ''}`}
          >
            <div className={styles.loaderGameIn}>
              {[...Array(27)].map((_, index) => (
                <div className={styles.loaderGameLine} key={index}></div>
              ))}
            </div>
            <div className={styles.loaderGameBall}></div>
          </div>
        </div>
      </div>
    </>
  );
};
