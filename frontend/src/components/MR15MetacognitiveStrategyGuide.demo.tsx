/**
 * MR15: Metacognitive Strategy Guide - Demo
 *
 * Demonstrates strategy learning and scaffold fading
 */

import React, { useState } from 'react';
import MR15MetacognitiveStrategyGuide from './MR15MetacognitiveStrategyGuide';

const MR15Demo: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const handleBehaviorDetected = (behavior: any) => {
    setLogs(prev => [...prev, `🔴 Behavior detected: ${behavior.type}`]);
  };

  const handleStrategyLearned = (strategy: string) => {
    setLogs(prev => [...prev, `✓ Learned: "${strategy}"`]);
  };

  const handleStrategyPracticed = (strategy: string) => {
    setLogs(prev => [...prev, `🎯 Practicing: "${strategy}"`]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div style={demoContainerStyle}>
      <h1>MR15: Metacognitive Strategy Guide - Demo</h1>

      <div style={twoColumnLayout}>
        <div style={mainColumnStyle}>
          <MR15MetacognitiveStrategyGuide
            onBehaviorDetected={handleBehaviorDetected}
            onStrategyLearned={handleStrategyLearned}
            onStrategyPracticed={handleStrategyPracticed}
            userExpertiseLevel="intermediate"
            suggestionsCount={15}
            verificationRate={0.4}
            iterationRate={0.2}
            sessionDuration={1800000} // 30 minutes
          />
        </div>

        <div style={sidebarStyle}>
          <div style={logBoxStyle}>
            <div style={logHeaderStyle}>
              <h3 style={logTitleStyle}>Activity Log</h3>
              <button
                onClick={clearLogs}
                style={clearButtonStyle}
              >
                Clear
              </button>
            </div>
            <div style={logEntriesStyle}>
              {logs.length === 0 ? (
                <p style={emptyLogStyle}>Interact with component above...</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={logEntryStyle}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={infoBoxStyle}>
            <h3>Feature Highlights:</h3>
            <ul style={featureListStyle}>
              <li>4 Strategy Categories: Planning, Monitoring, Evaluation, Regulation</li>
              <li>16 Total Strategies with detailed guidance</li>
              <li>6 Case Studies: Effective vs Ineffective examples</li>
              <li>Just-in-Time Prompts for detected behaviors</li>
              <li>Scaffold Fading: Reduces guidance as competence increases</li>
              <li>Proficiency Tracking across all categories</li>
              <li>Pattern F Prevention: Detects passive acceptance risks</li>
            </ul>
          </div>

          <div style={designBoxStyle}>
            <h3>Design Evidence:</h3>
            <p><strong>Interview Base:</strong> 33/49 users (67%) don't understand advanced AI strategies</p>
            <p><strong>Prevents:</strong> Pattern F (passive, ineffective AI use)</p>
            <p><strong>Supports:</strong> Patterns A-E through metacognitive development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const demoContainerStyle: React.CSSProperties = {
  maxWidth: '1600px',
  margin: '0 auto',
  padding: '2rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh'
};

const twoColumnLayout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 320px',
  gap: '1.5rem',
  marginTop: '1.5rem'
};

const mainColumnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const logBoxStyle: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  color: '#e0e0e0',
  borderRadius: '8px',
  padding: '1rem',
  overflow: 'hidden'
};

const logHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #404040'
};

const logTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: '600',
  color: '#4a9eff'
};

const clearButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  backgroundColor: '#404040',
  color: '#e0e0e0',
  border: '1px solid #606060',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '600'
};

const logEntriesStyle: React.CSSProperties = {
  maxHeight: '200px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontSize: '0.85rem',
  fontFamily: 'monospace'
};

const logEntryStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderLeft: '2px solid #4a9eff',
  paddingLeft: '0.75rem'
};

const emptyLogStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#808080',
  fontStyle: 'italic',
  margin: '1rem 0'
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '1rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const featureListStyle: React.CSSProperties = {
  margin: '0.5rem 0',
  paddingLeft: '1.25rem',
  fontSize: '0.85rem',
  color: '#666',
  lineHeight: '1.6'
};

const designBoxStyle: React.CSSProperties = {
  backgroundColor: '#e6f2ff',
  borderRadius: '8px',
  padding: '1rem',
  borderLeft: '4px solid #0066ff',
  fontSize: '0.85rem',
  color: '#333'
};

export default MR15Demo;
