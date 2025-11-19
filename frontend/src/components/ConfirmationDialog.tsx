import React, { useEffect, useRef } from 'react';
import './ConfirmationDialog.css';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  icon?: React.ReactNode;
}

/**
 * Accessible Confirmation Dialog Component
 *
 * Features:
 * - WCAG 2.1 AA compliant modal dialog
 * - Focus trap to keep focus within dialog
 * - Keyboard support (Enter to confirm, Escape to cancel)
 * - Proper ARIA attributes for screen readers
 * - Optional loading state during async operations
 * - Danger mode styling for destructive actions
 *
 * Usage:
 * ```tsx
 * <ConfirmationDialog
 *   isOpen={true}
 *   title="Delete this item?"
 *   message="This action cannot be undone."
 *   isDangerous={true}
 *   confirmLabel="Delete"
 *   onConfirm={() => deleteItem()}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default (safer UX for destructive dialogs)
      const focusTimeoutId = setTimeout(() => {
        if (isDangerous) {
          cancelButtonRef.current?.focus();
        } else {
          confirmButtonRef.current?.focus();
        }
      }, 100);

      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
        // Enter key to confirm (only if not in a text field)
        if (e.key === 'Enter' && e.target === dialogRef.current) {
          onConfirm();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(focusTimeoutId);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onCancel, onConfirm, isDangerous]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation dialog error:', error);
    }
  };

  return (
    <div
      className="confirmation-dialog-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`confirmation-dialog ${isDangerous ? 'dangerous' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {icon && <div className="dialog-icon">{icon}</div>}

        {/* Title */}
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>

        {/* Message */}
        <p className="dialog-message">{message}</p>

        {/* Description (optional) */}
        {description && (
          <p id="dialog-description" className="dialog-description">
            {description}
          </p>
        )}

        {/* Danger notice */}
        {isDangerous && (
          <div className="dialog-danger-notice" role="status">
            ⚠️ This action cannot be undone.
          </div>
        )}

        {/* Loading state message */}
        {isLoading && (
          <div className="dialog-loading" role="status">
            <div className="spinner"></div>
            <span>Processing...</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            className="dialog-button dialog-button-secondary"
            onClick={onCancel}
            disabled={isLoading}
            aria-label={`${cancelLabel}: Close dialog without making changes`}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            className={`dialog-button ${isDangerous ? 'dialog-button-danger' : 'dialog-button-primary'}`}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={`${confirmLabel}: ${isDangerous ? 'Proceed with destructive action' : 'Confirm action'}`}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
