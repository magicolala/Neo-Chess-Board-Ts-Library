import React from 'react';
import styles from '../App.module.css';

// Loader simple en ligne
export const InlineLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`${styles.loader} ${className}`} />
);

// Loader grand format
export const LargeLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div style={{ textAlign: 'center' }}>
    <div className={`${styles.loader} ${styles.loaderLarge}`} />
    {text && <div className={styles.loadingText}>{text}</div>}
  </div>
);

// Overlay de loading
export const LoadingOverlay: React.FC<{
  children?: React.ReactNode;
  text?: string;
}> = ({ children, text = 'Chargement...' }) => (
  <div className={styles.loadingOverlay}>
    <div>{children || <LargeLoader text={text} />}</div>
  </div>
);

// Loader à points animés
export const DotLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.dotLoader} ${className}`}>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
);

// Loader pulse
export const PulseLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.pulseLoader} ${className}`} />
);

// Skeleton loader pour le texte
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={className}>
    {Array.from({ length: lines }, (_, i) => (
      <div
        key={i}
        className={`${styles.skeletonLoader} ${styles.skeletonText}`}
        style={{ width: `${80 + Math.random() * 20}%` }}
      />
    ))}
  </div>
);

// Skeleton loader pour les boutons
export const SkeletonButtons: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className = '' }) => (
  <div className={`${styles.buttonGroup} ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${styles.skeletonLoader} ${styles.skeletonButton}`} />
    ))}
  </div>
);

// Hook pour simuler les états de loading
export const useLoadingState = (duration: number = 2000): boolean => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return isLoading;
};

// Composant pour un bouton avec état de loading
export const LoadingButton: React.FC<{
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ isLoading = false, children, onClick, className = '', disabled = false }) => (
  <button
    className={`${className} ${isLoading ? styles.buttonLoading : ''}`}
    onClick={onClick}
    disabled={disabled || isLoading}
    style={{ position: 'relative' }}
  >
    {isLoading && <InlineLoader />}
    <span style={{ opacity: isLoading ? 0 : 1 }}>{children}</span>
  </button>
);
