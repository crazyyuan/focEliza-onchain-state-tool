import React, { ReactNode, useEffect, useRef } from "react";
import styles from "./Dialog.module.css";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface DialogTitleProps {
  children: ReactNode;
}

interface DialogContentProps {
  children: ReactNode;
}

interface DialogActionsProps {
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent scrolling when dialog is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = ""; // Restore scrolling when dialog is closed
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContainer} ref={dialogRef}>
        {children}
      </div>
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return <div className={styles.dialogTitle}>{children}</div>;
};

export const DialogContent: React.FC<DialogContentProps> = ({ children }) => {
  return <div className={styles.dialogContent}>{children}</div>;
};

export const DialogActions: React.FC<DialogActionsProps> = ({ children }) => {
  return <div className={styles.dialogActions}>{children}</div>;
};
