import styles from "./Header.module.css";


interface Props {
  phase: 'menu' | 'round' | 'summary';
  round?: number;
  total?: number;
}

export default function Header({ phase, round, total }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🎬</span>
          <span className={styles.title}>Movie Game</span>
        </div>
        <div className={styles.right}>

        </div>
      </div>
    </header>
  );
}
