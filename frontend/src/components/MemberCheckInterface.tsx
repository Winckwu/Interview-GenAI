/**
 * Member Check Interface
 * Validates Pattern recognition accuracy through user feedback
 * Based on 08 methodology: member checking with 20 simulated users
 */

import React, { useState } from 'react';

export interface PatternDescription {
  pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  name: string;
  description: string;
  characteristics: string[];
  riskLevel: string;
}

export const PATTERN_DESCRIPTIONS: Record<string, PatternDescription> = {
  A: {
    pattern: 'A',
    name: 'Strategic Control',
    description: 'High verification and independent work. Self-first approach with rigorous quality control.',
    characteristics: [
      'Verifies AI outputs carefully',
      'Decomposes complex tasks',
      'Multiple iteration cycles',
      'Strong independent work'
    ],
    riskLevel: 'Low'
  },
  B: {
    pattern: 'B',
    name: 'Iterative Refinement',
    description: 'Balanced AI-human workflow with moderate iteration and verification.',
    characteristics: [
      'Multiple AI queries per task',
      'Moderate verification',
      'Iterative improvements',
      'Collaborative refinement'
    ],
    riskLevel: 'Medium'
  },
  C: {
    pattern: 'C',
    name: 'Context-Sensitive Adaptation',
    description: 'Adjusts AI reliance based on task importance and context.',
    characteristics: [
      'Situation-dependent AI use',
      'Adaptive support levels',
      'Context-aware decisions',
      'Risk-based strategies'
    ],
    riskLevel: 'Medium'
  },
  D: {
    pattern: 'D',
    name: 'Deep Verification',
    description: 'Emphasis on understanding and learning through detailed verification.',
    characteristics: [
      'Deep analysis of AI outputs',
      'Learning-focused approach',
      'Verification for understanding',
      'Knowledge building'
    ],
    riskLevel: 'Low'
  },
  E: {
    pattern: 'E',
    name: 'Teaching and Collaboration',
    description: 'Focus on knowledge sharing and peer learning.',
    characteristics: [
      'Collaborative learning',
      'Teaching peers',
      'Knowledge sharing',
      'Group-based learning'
    ],
    riskLevel: 'Low'
  },
  F: {
    pattern: 'F',
    name: 'Over-Reliance',
    description: 'High AI dependency with low verification and rapid acceptance.',
    characteristics: [
      'High AI dependency',
      'Low verification rate',
      'Rapid acceptance',
      'Independence decline'
    ],
    riskLevel: 'High'
  }
};

export interface MemberCheckFeedback {
  userId: string;
  detectedPattern: string;
  detectedSecondaryPattern?: string; // New: secondary pattern if hybrid
  accuracyRating: number; // 1-5 scale
  secondaryAccuracyRating?: number; // New: rating for secondary pattern accuracy
  matchesActualPattern: boolean; // Derived from rating > 3
  suggestedPattern?: string;
  suggestedSecondaryPattern?: string; // New: suggested secondary if hybrid not accurate
  contextSwitching: boolean;
  contextSwitchingTriggers?: string[]; // New: what triggers pattern switching
  comments?: string;
  hybridFeedback?: string; // New: specific feedback on hybrid pattern
  timestamp: Date;
}

export interface MemberCheckResult {
  totalUsers: number;
  accurateCount: number;
  accuracyRate: number;
  contextSwitchers: number;
  commonMisclassifications: Record<string, string[]>;
  feedbackData: MemberCheckFeedback[];
}

interface MemberCheckInterfaceProps {
  userId: string;
  detectedPattern: string;
  userName?: string;
  onFeedbackSubmit?: (feedback: MemberCheckFeedback) => void;
  showPatternExplanation?: boolean;
}

export const MemberCheckInterface: React.FC<MemberCheckInterfaceProps> = ({
  userId,
  detectedPattern,
  userName = `User ${userId}`,
  onFeedbackSubmit,
  showPatternExplanation = true
}) => {
  const [accuracyRating, setAccuracyRating] = useState<number>(0);
  const [suggestedPattern, setSuggestedPattern] = useState<string>('');
  const [contextSwitching, setContextSwitching] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const pattern = PATTERN_DESCRIPTIONS[detectedPattern as keyof typeof PATTERN_DESCRIPTIONS];

  const handleSubmit = () => {
    if (accuracyRating === 0) {
      alert('Please provide an accuracy rating');
      return;
    }

    const feedback: MemberCheckFeedback = {
      userId,
      detectedPattern,
      accuracyRating,
      matchesActualPattern: accuracyRating > 3,
      suggestedPattern: suggestedPattern || undefined,
      contextSwitching,
      comments: comments || undefined,
      timestamp: new Date()
    };

    onFeedbackSubmit?.(feedback);
    setSubmitted(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setAccuracyRating(0);
      setSuggestedPattern('');
      setContextSwitching(false);
      setComments('');
      setSubmitted(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="member-check-success">
        <div className="success-message">
          <h3>✓ 感谢反馈</h3>
          <p>您的反馈已记录，帮助我们改进系统</p>
        </div>
      </div>
    );
  }

  return (
    <div className="member-check-interface">
      <div className="check-header">
        <h2>模式识别验证</h2>
        <p className="user-info">
          {userName} - 识别到的使用模式：<strong>{pattern.name}</strong>
        </p>
      </div>

      {showPatternExplanation && (
        <div className="pattern-explanation">
          <div className="pattern-card">
            <h3>
              模式 {detectedPattern}: {pattern.name}
            </h3>
            <p className="description">{pattern.description}</p>
            <div className="characteristics">
              <h4>主要特征：</h4>
              <ul>
                {pattern.characteristics.map((char, idx) => (
                  <li key={idx}>{char}</li>
                ))}
              </ul>
            </div>
            <div className="risk-level">
              风险等级：
              <span className={`badge-${pattern.riskLevel.toLowerCase()}`}>
                {pattern.riskLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="feedback-form">
        <div className="form-section">
          <label className="section-label">
            <h3>1. 这个Pattern描述准确吗？</h3>
          </label>
          <div className="rating-options">
            {[
              { value: 5, label: '非常准确' },
              { value: 4, label: '比较准确' },
              { value: 3, label: '一般' },
              { value: 2, label: '不太准确' },
              { value: 1, label: '完全不准确' }
            ].map((option) => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="accuracy"
                  value={option.value}
                  checked={accuracyRating === option.value}
                  onChange={(e) => setAccuracyRating(parseInt(e.target.value))}
                />
                <span className="radio-label">
                  ○ {option.label} ({option.value})
                </span>
              </label>
            ))}
          </div>
        </div>

        {accuracyRating > 0 && accuracyRating <= 3 && (
          <div className="form-section">
            <label className="section-label">
              <h3>2. 如果不准确，你认为更符合哪个Pattern？</h3>
            </label>
            <div className="pattern-select">
              {Object.entries(PATTERN_DESCRIPTIONS).map(([key, value]) => (
                <label key={key} className="checkbox-option">
                  <input
                    type="radio"
                    name="suggestedPattern"
                    value={key}
                    checked={suggestedPattern === key}
                    onChange={(e) => setSuggestedPattern(e.target.value)}
                  />
                  <span className="checkbox-label">
                    {key}: {value.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-section">
          <label className="section-label">
            <h3>3. 你的使用方式是否会根据情境变化？</h3>
          </label>
          <div className="checkbox-options">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={contextSwitching}
                onChange={(e) => setContextSwitching(e.target.checked)}
              />
              <span className="checkbox-label">
                是，我会根据任务重要性切换AI使用策略
              </span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={!contextSwitching}
                onChange={(e) => setContextSwitching(!e.target.checked)}
              />
              <span className="checkbox-label">
                否，我的使用方式相对稳定
              </span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <label className="section-label">
            <h3>4. 其他反馈（可选）</h3>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="请描述你认为系统需要改进的地方..."
            rows={4}
            className="comments-input"
          />
        </div>

        <div className="form-actions">
          <button className="submit-button" onClick={handleSubmit}>
            提交反馈
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Member Check Validator
 * Analyzes member check feedback to validate pattern recognition accuracy
 */
export class MemberCheckValidator {
  static validateFeedback(feedbackList: MemberCheckFeedback[]): MemberCheckResult {
    const accurateCount = feedbackList.filter((f) => f.matchesActualPattern).length;
    const contextSwitchers = feedbackList.filter((f) => f.contextSwitching).length;

    // Identify common misclassifications
    const misclassifications: Record<string, string[]> = {};
    feedbackList
      .filter((f) => !f.matchesActualPattern && f.suggestedPattern)
      .forEach((f) => {
        const key = `${f.detectedPattern}->${f.suggestedPattern}`;
        if (!misclassifications[key]) {
          misclassifications[key] = [];
        }
        misclassifications[key].push(f.userId);
      });

    return {
      totalUsers: feedbackList.length,
      accurateCount,
      accuracyRate: (accurateCount / feedbackList.length) * 100,
      contextSwitchers,
      commonMisclassifications: misclassifications,
      feedbackData: feedbackList
    };
  }

  static generateReport(result: MemberCheckResult): string {
    const report = `
╔════════════════════════════════════════════════════════╗
║           成员检查过程验证报告                          ║
╚════════════════════════════════════════════════════════╝

📊 核心指标：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • 参与用户数：${result.totalUsers}
  • 准确识别数：${result.accurateCount}
  • 识别准确率：${result.accuracyRate.toFixed(1)}% ${
      result.accuracyRate >= 90 ? '✓ 超过目标' : '⚠ 未达目标'
    }
  • 情境切换用户：${result.contextSwitchers}
    (${((result.contextSwitchers / result.totalUsers) * 100).toFixed(1)}%)

🔍 误分类分析：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${
  Object.entries(result.commonMisclassifications).length > 0
    ? Object.entries(result.commonMisclassifications)
        .map(([key, users]) => `  ${key}: ${users.length} 用户 (${users.join(', ')})`)
        .join('\n')
    : '  无显著误分类'
}

📋 结论：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${
  result.accuracyRate >= 90
    ? `✓ Pattern识别系统准确性优秀（${result.accuracyRate.toFixed(1)}%）
  系统能够准确识别用户的AI使用模式。`
    : `⚠ Pattern识别系统准确性需改进（${result.accuracyRate.toFixed(1)}%）
  需要调整检测算法或扩展特征集。`
}

${
  result.contextSwitchers > 0
    ? `
📌 发现情境切换用户（${result.contextSwitchers}人）：
   系统需支持混合模式检测，允许用户根据情境调整策略。`
    : ''
}
`;

    return report;
  }
}

export default MemberCheckInterface;
