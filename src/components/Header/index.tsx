import styles from "./Header.module.css";
import ThemeToggle from "../ThemeToggle";

import AccentPicker from "../AccentPicker";

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  phase: 'menu' | 'round' | 'summary';
  round?: number;
  total?: number;
  accent: string;
  onAccentChange: (hex: string) => void;
}

export default function Header({ theme, onToggleTheme, accent, onAccentChange }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🎬</span>
          <span className={styles.title}>Movie Game</span>
        </div>
        <div className={styles.right}>
          <AccentPicker accent={accent} onChange={onAccentChange} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
