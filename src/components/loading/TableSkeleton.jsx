import styles from './TableSkeleton.module.css';

export default function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className={styles.skeletonRow}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx}>
              <span
                className={styles.skeletonCell}
                style={{ width: `${Math.max(40, 85 - (cIdx * 12) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
