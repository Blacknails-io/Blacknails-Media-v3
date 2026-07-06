import styles from './FistMosaicTest.module.css';

export function FistMosaicTest() {
  return (
    <div className={styles.container}>
      {/* Background to blur */}
      <div className={styles.waveBackground} />

      {/* Pure CSS Frosted Glass clipped to the Fist */}
      <div className={styles.fistGlass} />
      
      {/* Optional: Add a subtle overlay for extra shine if desired */}
      <div className={styles.fistShine} />

      <img src="/assets/forge-logo/fist-lines-painted.png" className={styles.fistLines} alt="Fist details" />
    </div>
  );
}
