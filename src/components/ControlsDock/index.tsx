import ThemeToggle from "../ThemeToggle";
import styles from "./ControlsDock.module.css";

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function ControlsDock({ theme, onToggleTheme }: Props) {
  return (
    <div className={styles.dock}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </div>
  );
}
