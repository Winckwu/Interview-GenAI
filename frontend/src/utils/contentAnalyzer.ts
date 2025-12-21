/**
 * Content Analyzer for Trust Indicator
 *
 * Analyzes AI response content to explain WHY the trust score is what it is.
 * Returns factors that contributed to the score (positive and negative).
 */

export interface TrustFactor {
  icon: string;
  text: string;
  impact: 'positive' | 'negative' | 'neutral';
  points: number;  // How much this factor contributed
}

export interface ContentAnalysisResult {
  factors: TrustFactor[];
  actionLabel: string;
}

/**
 * Analyze content and return factors explaining the trust score
 */
export function analyzeContentFactors(content: string, trustScore: number): ContentAnalysisResult {
  const factors: TrustFactor[] = [];

  if (!content || content.length < 10) {
    return {
      factors: [{ icon: '📝', text: 'Short response', impact: 'neutral', points: 0 }],
      actionLabel: getActionLabel(trustScore),
    };
  }

  // 1. Check for uncertainty indicators (negative)
  const uncertaintyPatterns = [
    { pattern: /\b(might|maybe|perhaps|possibly|could be|may be)\b/gi, text: 'Uncertain language' },
    { pattern: /\b(not sure|uncertain|unsure|unclear)\b/gi, text: 'Expressed uncertainty' },
    { pattern: /\b(I think|I believe|I guess|I suppose|it seems|appears to)\b/gi, text: 'Subjective phrasing' },
    { pattern: /\b(probably|likely|unlikely|potentially)\b/gi, text: 'Probabilistic terms' },
    { pattern: /(可能|也许|或许|大概|不确定|我认为|我觉得|似乎|好像)/g, text: 'Uncertain expressions' },
  ];

  let uncertaintyCount = 0;
  uncertaintyPatterns.forEach(({ pattern, text }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      uncertaintyCount += matches.length;
      if (!factors.find(f => f.text === text)) {
        factors.push({
          icon: '⚠️',
          text,
          impact: 'negative',
          points: -Math.min(matches.length * 2.5, 10),
        });
      }
    }
  });

  // 2. Check for confidence indicators (positive)
  const confidencePatterns = [
    { pattern: /\b(definitely|certainly|clearly|obviously|absolutely)\b/gi, text: 'Confident language' },
    { pattern: /\b(specifically|exactly|precisely)\b/gi, text: 'Precise terms' },
    { pattern: /(一定|确定|肯定|明确|显然)/g, text: 'Assertive expressions' },
  ];

  confidencePatterns.forEach(({ pattern, text }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      factors.push({
        icon: '✓',
        text,
        impact: 'positive',
        points: Math.min(matches.length * 1.5, 6),
      });
    }
  });

  // 3. Check structure quality (positive)
  if (/^\s*\d+[.)]\s/m.test(content)) {
    factors.push({ icon: '📋', text: 'Numbered list structure', impact: 'positive', points: 4 });
  }
  if (/^\s*[-*•]\s/m.test(content)) {
    factors.push({ icon: '•', text: 'Bullet point organization', impact: 'positive', points: 3 });
  }
  if (/^#{1,3}\s|^\*\*[^*]+\*\*:/m.test(content)) {
    factors.push({ icon: '📑', text: 'Clear headings', impact: 'positive', points: 3 });
  }
  if (/```[\s\S]*?```/.test(content)) {
    factors.push({ icon: '💻', text: 'Code examples provided', impact: 'positive', points: 5 });
  }
  if (/\|.*\|.*\|/m.test(content)) {
    factors.push({ icon: '📊', text: 'Table format used', impact: 'positive', points: 4 });
  }

  // 4. Check for specific evidence (positive)
  if (/\d+(\.\d+)?(%|个|次|年|月|日|元|美元|\$|GB|MB|KB)/.test(content)) {
    factors.push({ icon: '🔢', text: 'Specific numbers/data', impact: 'positive', points: 3 });
  }
  if (/https?:\/\/\S+/.test(content)) {
    factors.push({ icon: '🔗', text: 'Reference links included', impact: 'positive', points: 2 });
  }

  // 5. Check content length (longer = more thorough, generally positive)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 200) {
    factors.push({ icon: '📖', text: 'Detailed response', impact: 'positive', points: 3 });
  } else if (wordCount < 50) {
    factors.push({ icon: '📝', text: 'Brief response', impact: 'neutral', points: 0 });
  }

  // Sort: negative factors first, then positive
  factors.sort((a, b) => {
    if (a.impact === 'negative' && b.impact !== 'negative') return -1;
    if (a.impact !== 'negative' && b.impact === 'negative') return 1;
    return Math.abs(b.points) - Math.abs(a.points);
  });

  // Limit to top 4 most significant factors
  const limitedFactors = factors.slice(0, 4);

  // If no factors found, add a default
  if (limitedFactors.length === 0) {
    limitedFactors.push({
      icon: '📝',
      text: 'Standard response format',
      impact: 'neutral',
      points: 0,
    });
  }

  return {
    factors: limitedFactors,
    actionLabel: getActionLabel(trustScore),
  };
}

/**
 * Get action label based on trust score
 */
function getActionLabel(trustScore: number): string {
  if (trustScore >= 80) {
    return 'Quick check sufficient';
  } else if (trustScore >= 60) {
    return 'Verify key points';
  } else if (trustScore >= 40) {
    return 'Review carefully';
  } else {
    return 'Expert review recommended';
  }
}

/**
 * Get trust level icon based on score
 */
export function getTrustIcon(trustScore: number): string {
  if (trustScore >= 80) {
    return '✅';
  } else if (trustScore >= 60) {
    return '⚡';
  } else if (trustScore >= 40) {
    return '⚠️';
  } else {
    return '🔍';
  }
}

/**
 * Get trust color scheme based on score
 */
export function getTrustColors(trustScore: number): {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
} {
  if (trustScore >= 80) {
    return {
      text: '#166534',      // dark green
      bg: '#22c55e',        // green
      bgLight: '#dcfce7',   // light green
      border: '#86efac',    // green border
    };
  } else if (trustScore >= 60) {
    return {
      text: '#92400e',      // dark amber
      bg: '#f59e0b',        // amber
      bgLight: '#fef3c7',   // light amber
      border: '#fcd34d',    // amber border
    };
  } else if (trustScore >= 40) {
    return {
      text: '#9a3412',      // dark orange
      bg: '#f97316',        // orange
      bgLight: '#ffedd5',   // light orange
      border: '#fdba74',    // orange border
    };
  } else {
    return {
      text: '#991b1b',      // dark red
      bg: '#ef4444',        // red
      bgLight: '#fee2e2',   // light red
      border: '#fca5a5',    // red border
    };
  }
}
