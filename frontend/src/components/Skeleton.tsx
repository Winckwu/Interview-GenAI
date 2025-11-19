import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Loading Component
 *
 * Displays a placeholder while content is loading.
 * Helps improve perceived performance.
 *
 * Usage:
 * <Skeleton variant="text" width={200} />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height={200} />
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const classes = [
    'skeleton',
    `skeleton-${variant}`,
    `skeleton-${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} style={style} aria-busy="true" />;
};

export default Skeleton;

/* ============================================
   Skeleton Variants
   ============================================ */

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width="100%"
          height={i === lines - 1 ? 16 : 20}
          className={i !== lines - 1 ? 'mb-2' : ''}
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div style={{ padding: 'var(--spacing-4)' }}>
        <Skeleton variant="text" width="80%" height={24} className="mb-2" />
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="90%" height={16} />
      </div>
    </div>
  );
};

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <Skeleton
      variant="circular"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
};
