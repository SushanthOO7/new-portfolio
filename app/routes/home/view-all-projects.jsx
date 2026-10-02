import { DecoderText } from '~/components/decoder-text';
import { Heading } from '~/components/heading';
import { Section } from '~/components/section';
import { Button } from '~/components/button';
import { Transition } from '~/components/transition';
import { tokens } from '~/components/theme-provider/theme';
import { cssProps } from '~/utils/style';
import styles from './view-all-projects.module.css';
import handsOkSvg from '~/assets/hands-ok.svg';

export const ViewAllProjects = ({ id, visible, sectionRef }) => {
  const titleId = `${id}-title`;

  return (
    <Section
      className={styles.viewAllProjects}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <Transition in={visible} timeout={0}>
        {({ visible, nodeRef }) => (
          <div className={styles.content} ref={nodeRef}>
            <div className={styles.container}>
              <div className={styles.centeredBox}>
                <div className={styles.animatedBorder}></div>
                <div className={styles.boxContent}>
                  <div className={styles.topRow}>
                    <Heading
                      className={styles.title}
                      data-visible={visible}
                      level={2}
                      id={titleId}
                      style={cssProps({ delay: tokens.base.durationXS })}
                    >
                      <DecoderText
                        text="Check out all projects"
                        start={visible}
                        delay={500}
                      />
                    </Heading>

                    <div className={styles.svgContainer}>
                      <img
                        src={handsOkSvg}
                        alt="Hands OK gesture"
                        className={styles.handsSvg}
                      />
                    </div>
                  </div>

                  <div className={styles.buttonContainer}>
                    <Button
                      className={styles.ctaButton}
                      data-visible={visible}
                      href="/projects"
                      style={cssProps({ delay: tokens.base.durationM })}
                    >
                      View All Projects
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Transition>
    </Section>
  );
};
