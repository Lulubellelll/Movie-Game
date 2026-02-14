import styles from "./SegmentedControl.module.css";

export type Option<T extends string | number> = { label: string; value: T };

interface Props<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export default function SegmentedControl<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <div className={styles.segmented} role="tablist" aria-label="options">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="tab"
            aria-selected={active}
            className={`${styles.item} ${active ? styles.active : ''}`}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
