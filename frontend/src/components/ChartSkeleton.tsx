import React from 'react';
import Skeleton from './Skeleton';
import './ChartSkeleton.css';

interface ChartSkeletonProps {
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  className?: string;
}

/**
 * Chart Skeleton Component
 *
 * Displays a placeholder while chart data is loading.
 * Supports different chart types with appropriate skeleton layouts.
 *
 * Usage:
 * <ChartSkeleton type="line" height={300} />
 * <ChartSkeleton type="bar" />
 * <ChartSkeleton type="pie" />
 */
const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'line',
  height = 300,
  className = ''
}) => {
  const containerStyle: React.CSSProperties = {
    height: `${height}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor: 'var(--color-bg-primary, #ffffff)',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid var(--color-border, #e5e7eb)',
  };

  if (type === 'line') {
    return (
      <div style={containerStyle} className={`chart-skeleton ${className}`}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '70%', marginBottom: '1rem' }}>
          {/* Line chart skeleton - shows bars of varying heights */}
          {[40, 60, 45, 75, 55, 80, 50].map((barHeight, i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={`${barHeight}%`}
                animation="wave"
              />
            </div>
          ))}
        </div>
        <Skeleton variant="text" width="100%" height={20} />
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div style={containerStyle} className={`chart-skeleton ${className}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '70%', marginBottom: '1rem' }}>
          {/* Bar chart skeleton - horizontal bars */}
          {[60, 45, 80, 50, 70].map((barWidth, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton
                variant="rectangular"
                width={`${barWidth}%`}
                height={24}
                animation="wave"
              />
            </div>
          ))}
        </div>
        <Skeleton variant="text" width="100%" height={20} />
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div style={containerStyle} className={`chart-skeleton ${className}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1 }}>
          {/* Pie chart skeleton - circular skeleton */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
            <Skeleton
              variant="circular"
              width={150}
              height={150}
              animation="wave"
            />
          </div>
          {/* Legend skeleton */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width={100} height={16} />
              </div>
            ))}
          </div>
        </div>
        <Skeleton variant="text" width="100%" height={20} />
      </div>
    );
  }

  // Default chart skeleton
  return (
    <div style={containerStyle} className={`chart-skeleton ${className}`}>
      <Skeleton variant="text" width="80%" height={24} className="mb-2" />
      <Skeleton variant="rectangular" width="100%" height="70%" animation="wave" />
      <Skeleton variant="text" width="100%" height={20} />
    </div>
  );
};

export default ChartSkeleton;

/* ============================================
   Chart Skeleton Variants
   ============================================ */

interface ChartSkeletonGroupProps {
  count?: number;
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  className?: string;
}

/**
 * Multiple chart skeletons in a grid layout
 * Useful for dashboards with multiple charts
 */
export const ChartSkeletonGroup: React.FC<ChartSkeletonGroupProps> = ({
  count = 3,
  type = 'line',
  height = 300,
  className = ''
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '1.5rem',
    }} className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} type={type} height={height} />
      ))}
    </div>
  );
};

/**
 * Card skeleton with chart inside
 * Includes header and footer placeholders
 */
interface ChartCardSkeletonProps {
  hasHeader?: boolean;
  hasFooter?: boolean;
  chartType?: 'line' | 'bar' | 'pie';
  height?: number;
  className?: string;
}

export const ChartCardSkeleton: React.FC<ChartCardSkeletonProps> = ({
  hasHeader = true,
  hasFooter = true,
  chartType = 'line',
  height = 300,
  className = ''
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-primary, #ffffff)',
      borderRadius: 'var(--radius-lg, 12px)',
      border: '1px solid var(--color-border, #e5e7eb)',
      overflow: 'hidden',
    }} className={className}>
      {/* Header */}
      {hasHeader && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" height={16} className="mb-2" style={{ marginTop: '0.5rem' }} />
        </div>
      )}

      {/* Chart */}
      <div style={{ padding: '1.5rem' }}>
        <ChartSkeleton type={chartType} height={height} />
      </div>

      {/* Footer */}
      {hasFooter && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-bg-secondary, #f9fafb)' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around' }}>
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={60} height={20} style={{ marginTop: '0.5rem' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
