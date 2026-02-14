import styles from "./ProgressDots.module.css";

interface Props {
  current: number; // 1-indexed
  total: number;
}

export default function ProgressDots({ current, total }: Props) {
  return (
    <div className={styles.dots} aria-label={`Round ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <span key={n} className={`${styles.dot} ${n <= current ? styles.active : ''}`} />
      ))}
    </div>
  );
}
