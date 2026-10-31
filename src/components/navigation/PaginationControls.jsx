import styles from './PaginationControls.module.css';
import buttonStyles from '../buttons/ActionButton.module.css';

export default function PaginationControls({ page, pageSize, totalItems, onPageChange, hasNext }) {
  const pageCount = Number.isFinite(totalItems) ? Math.ceil(totalItems / pageSize) : 0;
  const canGoNext = hasNext ?? page + 1 < pageCount;
  if (page === 0 && !canGoNext) return null;

  const firstItem = page * pageSize + 1;
  const lastItem = Number.isFinite(totalItems)
    ? Math.min((page + 1) * pageSize, totalItems)
    : page * pageSize + pageSize;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={buttonStyles.secondaryButton}
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className={styles.subtle}>
        {Number.isFinite(totalItems) ? `${firstItem}–${lastItem} of ${totalItems}` : `Page ${page + 1}`}
      </span>
      <button
        type="button"
        className={buttonStyles.secondaryButton}
        disabled={!canGoNext}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
