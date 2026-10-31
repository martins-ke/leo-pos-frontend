import { useEffect, useId, useRef, useState } from 'react';
import styles from './ExpandingSelect.module.css';

export default function ExpandingSelect({
  value,
  options,
  onChange,
  className = '',
  ariaLabel = 'Select an option',
  disabled = false,
  required = false,
  autoFocus = false,
  startAdornment = null
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = options.findIndex(option => String(option.value) === String(value));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (autoFocus) triggerRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  const openList = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const chooseOption = (option) => {
    onChange(String(option.value));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openList();
      } else {
        setActiveIndex(index => Math.min(index + 1, options.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList(selectedIndex >= 0 ? selectedIndex : options.length - 1);
      } else {
        setActiveIndex(index => Math.max(index - 1, 0));
      }
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      const activeOption = options[activeIndex];
      if (activeOption) chooseOption(activeOption);
    } else if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      openList();
    }
  };

  return (
    <div className={`${styles.root} ${open ? styles.open : ''} ${className}`} ref={rootRef}>
      <div className={styles.header}>
        {startAdornment && <span className={styles.adornment}>{startAdornment}</span>}
        {required && (
          <select
            className={styles.validationControl}
            value={value}
            required
            tabIndex={-1}
            aria-hidden="true"
            onChange={() => {}}
            onInvalid={event => {
              event.preventDefault();
              triggerRef.current?.focus();
              openList();
            }}
          >
            {options.map(option => (
              <option key={String(option.value)} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          className={styles.trigger}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-required={required || undefined}
          aria-invalid={required && !selectedOption ? 'true' : undefined}
          disabled={disabled || options.length === 0}
          onClick={() => open ? setOpen(false) : openList()}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget)) {
              setOpen(false);
            }
          }}
        >
          <span className={styles.value}>{selectedOption?.label ?? 'Choose an option'}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </div>
      <div
        id={listboxId}
        className={`${styles.optionsPanel} ${open ? styles.optionsPanelOpen : ''}`}
        role="listbox"
        aria-label={ariaLabel}
        aria-hidden={!open}
      >
        <div className={styles.options}>
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value);
            const isActive = activeIndex === index;

            return (
              <button
                key={String(option.value)}
                id={`${listboxId}-option-${index}`}
                type="button"
                className={`${styles.option} ${isSelected ? styles.selected : ''} ${isActive ? styles.active : ''}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={open ? -1 : undefined}
                disabled={!open}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseOption(option)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
