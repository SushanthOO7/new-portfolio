import { forwardRef, useId } from 'react';
import { classes } from '~/utils/style';
import styles from './monogram.module.css';

export const Monogram = forwardRef(({ highlight, className, ...props }, ref) => {
  const id = useId();
  const clipId = `${id}monogram-clip`;

  return (
    <svg
      aria-hidden
      className={classes(styles.monogram, className)}
      width="80"
      height="56"
      viewBox="0 0 35 35"
      ref={ref}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M23.94 22.17s10.55 -7.78 6.28 -12.81c-4.96 -5.84 -18.84 6.54 -20.36 4.02 -1.52 -2.52 12.33 -8.55 13.83 -9.55 0.16 -0.11 0.21 -0.32 0.16 -0.56l1.60 -0.19 -1.00 -0.50 0.26 -1.00 -1.16 0.91C23.11 1.71 22.37 0.87 21.95 0.57c-1.51 -1.00 -4.27 -0.76 -8.29 1.25 -4.02 2.01 -13.34 8.29 -8.57 15.33 4.27 6.28 16.55 -4.51 18.60 -2.77 1.76 1.51 -11.81 10.81 -11.81 10.81h5.78C16.67 27.71 11.88 35.00 11.88 35.00l17.40 -12.57c-1.83 -0.27 -5.34 -0.26 -5.34 -0.26zM19.21 1.32a1.13 1.13 0 0 1 1.20 1.04 1.13 1.13 0 0 1 -1.05 1.20 1.13 1.13 0 0 1 -1.20 -1.04 1.12 1.12 0 0 1 1.05 -1.20z" />
        </clipPath>
      </defs>
      <rect clipPath={`url(#${clipId})`} width="100%" height="100%" />
      {highlight && (
        <g clipPath={`url(#${clipId})`}>
          <rect className={styles.highlight} width="100%" height="100%" />
        </g>
      )}
    </svg>
  );
});
