import { baseMeta } from '~/utils/meta';
import React, { useEffect, useRef } from 'react';
import { Heading } from '~/components/heading';
import { Text } from '~/components/text';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import projectsData from './projects-data.json';
import styles from './projects.module.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const meta = () => {
  return baseMeta({
    title: 'Projects',
    description:
      'A Creative Studio. Devoted To Making Unique And Memorable Brands. Websites, Branding & Social Media.',
  });
};

const ProjectSection = ({ project, index, sectionRef }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: contentRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const numberStr = String(index + 1).padStart(2, '0');

  return (
    <section ref={sectionRef} className={styles.projectSection}>
      <div className={styles.numberBackground}>{numberStr}</div>

      <div ref={contentRef} className={styles.content}>
        <div className={styles.contentInner}>
          <Heading level={2} className={styles.projectTitle}>
            {project.name}
          </Heading>
          <Text className={styles.projectDescription}>
            {project.longDescription || project.shortDescription}
          </Text>
          {project.links && project.links.length > 0 && (
            <a
              href={project.links[0].url}
              className={styles.projectLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Project →
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export const Projects = () => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const pathRef = useRef(null);

  // Path segments - curves that flow smoothly down the page
  // Each segment covers approximately one project section (about 800-900 units vertical)
  const pathSegments = [
    "M 3783.544 1173",                                    // Start position
    "s -215.614 32.312 -261.132 439.434",                // Project 1 - curve down right
    "S 3098.258 2107.94 2877.975 2143.4",                // Project 2 - curve to left
    "c -176.579 32.284 -732.367 44.5 -743.764 410.187",  // Project 3 - big left curve
    "c 1.708 138.474 71.887 355.443 591.229 518.267",    // Project 4 - swing back right
    "s 1476.35 497.883 792.864 785.1",                   // Project 5 - curve down
    "c -260.408 109.428 -497.52 371.8 -511.872 539.99"   // Project 6 - final curve
  ];

  // Join all segments - use all of them for smooth continuous flow
  const dpath = pathSegments.join(" ");

  useEffect(() => {
    if (!pathRef.current || typeof window === 'undefined') return;

    const path = pathRef.current;
    const pathLength = path.getTotalLength();

    // Set up the path for animation
    gsap.set(path, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    // Animate the path on scroll
    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.projects} ref={containerRef}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <Heading level={1} className={styles.heroTitle}>
            Selected Work
          </Heading>
          <Text className={styles.heroSubtitle}>
            A collection of projects that showcase creativity, innovation, and attention to detail.
          </Text>
        </div>
      </section>

      <svg
        className={styles.animatedLine}
        width="1712.203"
        height="3286.62"
        viewBox="0 0 1712.203 3286.62"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="lineGradient"
            x1="0.5"
            x2="0.5"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor="var(--background)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--background)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          ref={pathRef}
          d={dpath}
          transform="translate(-2101.71 -1111.53)"
          fill="none"
          stroke="#f95900"
          strokeWidth="3"
          filter="url(#glow)"
        />
      </svg>

      {projectsData.map((project, index) => (
        <ProjectSection
          key={project.id}
          project={project}
          index={index}
          sectionRef={el => (sectionsRef.current[index] = el)}
        />
      ))}
    </div>
  );
}
