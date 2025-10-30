import React from 'react';
import { useTranslation } from '../i18n/translations';

// Inline loader indicator
export const InlineLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4 ${className}`}
  />
);

// Large loader with optional text
export const LargeLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="text-center">
    <div className="animate-spin rounded-full border-4 border-current border-t-transparent w-10 h-10 mx-auto" />
    {text && <div className="mt-2 text-gray-300">{text}</div>}
  </div>
);

// Loading overlay component
export const LoadingOverlay: React.FC<{
  children?: React.ReactNode;
  text?: string;
}> = ({ children, text }) => {
  const { translate } = useTranslation();
  const resolvedText = text ?? translate('loaders.default');

  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div>{children || <LargeLoader text={resolvedText} />}</div>
    </div>
  );
};

// Animated dot loader - simplified to a standard spinner
export const DotLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center w-20 h-20 ${className}`}>
    <div className="animate-spin rounded-full border-4 border-purple-500 border-t-transparent w-12 h-12" />
  </div>
);

// Pulse loader
export const PulseLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-6 h-6 bg-purple-500 rounded-full animate-pulse ${className}`} />
);

// Skeleton loader for text blocks
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => {
      const widthPercentage = 80 + ((i * 13) % 21);
      return (
        <div
          key={i}
          className="h-4 bg-gray-700 rounded animate-pulse"
          style={{ width: `${widthPercentage}%` }}
        />
      );
    })}
  </div>
);

// Skeleton loader for buttons
export const SkeletonButtons: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
    ))}
  </div>
);

// Hook that simulates loading states
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

// Button component that supports a loading state
export const LoadingButton: React.FC<{
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ isLoading = false, children, onClick, className = '', disabled = false }) => (
  <button
    className={`relative flex items-center justify-center ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
    onClick={onClick}
    disabled={disabled || isLoading}
  >
    {isLoading && (
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <InlineLoader />
      </span>
    )}
    <span className={isLoading ? 'opacity-0' : 'opacity-100'}>{children}</span>
  </button>
);
