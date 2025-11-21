import React from 'react';
import InfoTooltip from './InfoTooltip';
import './InfoTooltip.css';

/**
 * InfoTooltip Demo Component
 * Demonstrates all tooltip variants, sizes, and placements
 */
const InfoTooltipDemo: React.FC = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '32px' }}>InfoTooltip Component Demo</h1>

      {/* Variants Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '24px' }}>Variants</h2>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Info:</span>
            <InfoTooltip
              text="This is an information tooltip. Use it for general help and explanations."
              variant="info"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Warning:</span>
            <InfoTooltip
              text="This is a warning tooltip. Use it for cautions and important notices."
              variant="warning"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Error:</span>
            <InfoTooltip
              text="This is an error tooltip. Use it for errors and critical information."
              variant="error"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Success:</span>
            <InfoTooltip
              text="This is a success tooltip. Use it for confirmations and positive feedback."
              variant="success"
            />
          </div>
        </div>
      </section>

      {/* Sizes Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '24px' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Small (16px):</span>
            <InfoTooltip
              text="Small tooltip - perfect for inline text and compact spaces."
              size="small"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Medium (20px):</span>
            <InfoTooltip
              text="Medium tooltip - the default size, works well in most situations."
              size="medium"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Large (24px):</span>
            <InfoTooltip
              text="Large tooltip - great for headings and prominent elements."
              size="large"
            />
          </div>
        </div>
      </section>

      {/* Placements Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '24px' }}>Placements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '48px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Top (default):</span>
              <InfoTooltip
                text="Tooltip appears above the icon"
                placement="top"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Bottom:</span>
              <InfoTooltip
                text="Tooltip appears below the icon"
                placement="bottom"
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Left:</span>
              <InfoTooltip
                text="Tooltip appears to the left of the icon"
                placement="left"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Right:</span>
              <InfoTooltip
                text="Tooltip appears to the right of the icon"
                placement="right"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Combined Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '24px' }}>Real-World Examples</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metric Card Example */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Total Sessions</span>
              <InfoTooltip
                text="Number of conversation sessions with actual interactions. Auto-created empty sessions are not counted."
                size="small"
              />
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6' }}>5</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>24 total interactions recorded</div>
          </div>

          {/* High-Risk Domain Example */}
          <div style={{
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fffbeb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>⚠ MEDICAL</span>
              <InfoTooltip
                text="High-risk domain: Medical, Legal, or Financial. Extra verification strongly recommended."
                variant="warning"
                size="small"
              />
            </div>
            <div style={{ fontSize: '14px', marginTop: '8px', color: '#92400e' }}>
              This content requires thorough verification
            </div>
          </div>

          {/* Success Notification Example */}
          <div style={{
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f0fdf4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>✓ Verification Complete</span>
              <InfoTooltip
                text="Your verification was successfully recorded. Thank you for helping improve AI accuracy!"
                variant="success"
                size="small"
              />
            </div>
          </div>

          {/* Error Alert Example */}
          <div style={{
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fef2f2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>✗ Verification Failed</span>
              <InfoTooltip
                text="Unable to verify this content. The AI confidence score is below the acceptable threshold."
                variant="error"
                size="small"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Usage Notes */}
      <section>
        <h2 style={{ marginBottom: '16px' }}>Usage Notes</h2>
        <ul style={{ lineHeight: 1.8, color: '#4b5563' }}>
          <li><strong>Info (blue)</strong>: Default variant for general information and explanations</li>
          <li><strong>Warning (yellow/orange)</strong>: For cautions, high-risk domains, and important notices</li>
          <li><strong>Error (red)</strong>: For errors, critical issues, and failed operations</li>
          <li><strong>Success (green)</strong>: For confirmations, successful operations, and positive feedback</li>
          <li><strong>Accessibility</strong>: All tooltips support keyboard navigation (Enter/Space to toggle, Escape to close)</li>
          <li><strong>Animations</strong>: Smooth fade-in transitions and hover effects</li>
          <li><strong>Responsive</strong>: Automatically adjusts on mobile devices (240px width on small screens)</li>
        </ul>
      </section>
    </div>
  );
};

export default InfoTooltipDemo;
