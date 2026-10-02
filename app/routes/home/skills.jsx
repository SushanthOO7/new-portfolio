import { DecoderText } from '~/components/decoder-text';
import { Heading } from '~/components/heading';
import { Section } from '~/components/section';
import { GradientText } from '~/components/gradient-text';
import { useTheme } from '~/components/theme-provider/theme-provider';
import { useRef, useEffect, useState } from 'react';
import { MY_STACK } from './skills-data';
import styles from './skills.module.css';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import seleniumSvg from '~/assets/icons/selenium.svg';
import jenkinsSvg from '~/assets/icons/jenkins.svg';
import prometheusSvg from '~/assets/icons/prometheus.svg';
import influxdbSvg from '~/assets/icons/influxdb.svg';
import jmeterSvg from '~/assets/icons/jmeter.svg';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Custom SVG component wrapper
const CustomSvgIcon = ({ svgPath, size, className }) => {
  return (
    <img
      src={svgPath}
      alt="icon"
      style={{
        width: size || '68px',
        height: size || '68px',
        objectFit: 'contain',
      }}
      className={className}
    />
  );
};

// Custom icons mapping
const customIcons = {
  selenium: seleniumSvg,
  jenkins: jenkinsSvg,
  prometheus: prometheusSvg,
  influxdb: influxdbSvg,
  jmeter: jmeterSvg,
};

// Client-side only StackIcon component to avoid SSR issues
const ClientStackIcon = ({ name, size, className }) => {
  const [StackIcon, setStackIcon] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const loadStackIcon = async () => {
      // First check if it's a custom icon
      if (customIcons[name]) {
        setStackIcon(() => customIcons[name]);
        setIsCustom(true);
        setIsLoaded(true);
        return;
      }

      // Otherwise try tech-stack-icons
      try {
        const { StackIcon: NamedStackIcon } = await import('tech-stack-icons');
        if (NamedStackIcon && typeof NamedStackIcon === 'function') {
          setStackIcon(() => NamedStackIcon);
          setIsLoaded(true);
          return;
        }
      } catch {}
      try {
        const pkg = await import('tech-stack-icons');
        const StackIconComponent = pkg.default?.StackIcon || pkg.default;
        if (StackIconComponent && typeof StackIconComponent === 'function') {
          setStackIcon(() => StackIconComponent);
          setIsLoaded(true);
        } else {
          setIsLoaded(true);
        }
      } catch {
        setIsLoaded(true);
      }
    };
    loadStackIcon();
  }, [name]);
  
  if (!isLoaded || !StackIcon) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  if (isCustom) {
    return <CustomSvgIcon svgPath={StackIcon} size={size} className={className} />;
  }
  
  // Determine if dark theme based on theme value
  const isDark = theme === 'dark';
  
  return (
    <StackIcon 
      name={name} 
      size={size} 
      className={className}
      variant={isDark ? 'dark' : 'light'}
    />
  );
};


export const Skills = ({ id, visible, sectionRef }) => {
  const titleId = `${id}-title`;
  const containerRef = useRef(null);

  // GSAP ScrollTrigger animation for slide-up effect with scrub
  useGSAP(
    () => {
      const slideUpEl = containerRef.current?.querySelectorAll(`.${styles.slideUp}`);

      if (!slideUpEl?.length) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 80%',
          scrub: 0.5,
        },
      });

      tl.from(slideUpEl, {
        opacity: 0,
        y: 40,
        ease: 'none',
        stagger: 0.4,
      });
    },
    { scope: containerRef }
  );

  return (
    <Section
      className={styles.skills}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className={styles.content} ref={containerRef}>
        <div className={styles.header}>
          <Heading className={styles.title} level={3} id={titleId}>
            <span className={styles.titleIcon}>*</span>
            <GradientText gradient="secondary">
              <DecoderText text="My Stack" start={visible} delay={500} />
            </GradientText>
          </Heading>
        </div>

        <div className={styles.stackContainer}>
          {Object.entries(MY_STACK).map(([category, skills]) => (
            <div key={category} className={styles.categoryRow}>
              <div className={styles.categoryTitle}>
                <h3 className={`${styles.categoryText} ${styles.slideUp}`}>
                  {category}
                </h3>
              </div>

              <div className={styles.skillsGrid}>
                {skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={`${styles.skillItem} ${styles.slideUp}`}
                  >
                    <div className={styles.skillIcon}>
                      <ClientStackIcon
                        name={skill.icon}
                        size="68"
                        className={styles.iconImage}
                      />
                    </div>
                    <span className={styles.skillName}>{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
