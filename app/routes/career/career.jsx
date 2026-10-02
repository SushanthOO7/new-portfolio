import { useEffect, useRef } from 'react';
import { Section } from '~/components/section';
import { baseMeta } from '~/utils/meta';
import styles from './career.module.css';

export const meta = () => {
  return baseMeta({
    title: 'Career',
    description: 'My career journey and professional experience',
  });
};

export const Career = () => {
  const sectionRef = useRef(null);
  const visible = true;
  const id = 'career';
  const careerData = [
    {
      position: 'Internship',
      company: 'The Sparks Foundation',
      year: '2021',
      description:
        'Completed comprehensive web development training at The Sparks Foundation, designing and developing a banking system web application with user account management and transaction functionality using HTML, CSS, and web design principles.',
    },
    {
      position: 'Intership',
      company: 'Elite Techno Groups',
      year: '2021',
      description:
        'Developed AI cancer detection model using human cell data and Python classification algorithms, implementing end-to-end machine learning workflow including data preprocessing, feature extraction, and model optimization for healthcare applications.',
    },
    {
      position: 'Associate Software QA Engineer',
      company: 'Informatica',
      year: '2022',
      description:
        'Developed and maintained test automation frameworks for Informatica Data Integration platform, including UI/API testing for Cloud Application Integration, Task Flow automation, and multi-cloud deployment validation using Java, Selenium, and Python.',
    },
    {
      position: 'Software QA Engineer',
      company: 'Informatica',
      year: '2024',
      description:
        'Designed and implemented end-to-end QA automation infrastructure including Java/Selenium frameworks, multi-cloud deployment workflows, and monitoring solutions with Jenkins, Prometheus, Grafana, and MySQL across AWS, GCP, Azure, and Oracle environments.',
    },
  ];

  useEffect(() => {
    if (!visible) return;

    const timeline = sectionRef.current?.querySelector('.career-timeline');
    const dot = sectionRef.current?.querySelector('.career-dot');
    const section = sectionRef.current;

    if (!timeline || !section) return;

    const handleScroll = () => {
      const sectionRect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight - 400;

      const isInViewport = sectionRect.top < windowHeight && sectionRect.bottom > 0;

      if (!isInViewport) {
        timeline.style.maxHeight = '0%';
        timeline.style.opacity = '1';
        if (dot) {
          dot.style.animationPlayState = 'paused';
        }
        return;
      }

      let progress = 0;

      if (sectionRect.top <= windowHeight) {
        const visibleAmount = Math.min(
          windowHeight - sectionRect.top,
          sectionRect.height
        );
        progress = Math.max(0, visibleAmount) / sectionRect.height;
        progress = Math.min(progress, 1);
      }

      progress = Math.min(progress, 1);

      const maxHeightValue = progress * 100;
      timeline.style.maxHeight = maxHeightValue + '%';
      timeline.style.opacity = '1';

      // Control dot animation based on timeline progress
      if (dot) {
        if (maxHeightValue >= 100) {
          // Stop animation when timeline is fully revealed
          dot.style.animationPlayState = 'paused';
        } else {
          // Keep animating while timeline is still growing
          dot.style.animationPlayState = 'running';
          dot.style.animationIterationCount = 'infinite';
        }
      }

      console.log('Section visible, Timeline height:', maxHeightValue.toFixed(1) + '%');
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible, sectionRef]);

  return (
    <Section>
      <section
        className={`${styles.careerSection} section-container career-section`}
        ref={sectionRef}
        id={id}
        data-visible={visible}
      >
        <div className={styles.careerContainer}>
          <h2 className={styles.careerTitle}>
            My Career <span>&</span>
            <br /> Experience
          </h2>
          <div className={styles.careerInfo}>
            <div className={`${styles.careerTimeline} career-timeline`}>
              <div className={`${styles.careerDot} career-dot`}></div>
            </div>
            {careerData.map((item, index) => (
              <div key={index} className={`${styles.careerInfoBox} career-info-box`}>
                <div className={styles.careerInfoIn}>
                  <div className={styles.careerRole}>
                    <h4>{item.position}</h4>
                    <h5>{item.company}</h5>
                  </div>
                  <h3>{item.year}</h3>
                </div>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Section>
  );
};
