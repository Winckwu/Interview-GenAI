/**
 * Content Analyzer for Trust Indicator
 *
 * Analyzes AI response content to generate specific verification suggestions
 * based on detected patterns (code, data, claims, etc.)
 */

export interface VerificationSuggestion {
  icon: string;
  text: string;
  reason: string;  // Why this suggestion was triggered
  priority: 'high' | 'medium' | 'low';
}

export interface ContentAnalysisResult {
  suggestions: VerificationSuggestion[];
  detectedPatterns: string[];
  actionLabel: string;  // Short action label like "建议核实要点"
}

/**
 * Pattern detection rules
 */
const DETECTION_RULES: Array<{
  name: string;
  pattern: RegExp;
  suggestion: Omit<VerificationSuggestion, 'reason'>;
  reasonTemplate: string;
}> = [
  // Code patterns
  {
    name: 'for_loop',
    pattern: /\b(for|while)\s*\(/i,
    suggestion: { icon: '🔄', text: '检查循环边界条件', priority: 'high' },
    reasonTemplate: '检测到循环语句',
  },
  {
    name: 'if_condition',
    pattern: /\bif\s*\([^)]+\)\s*{/,
    suggestion: { icon: '🔀', text: '验证条件判断逻辑', priority: 'medium' },
    reasonTemplate: '检测到条件判断',
  },
  {
    name: 'api_fetch',
    pattern: /\b(fetch|axios|ajax|http|request)\s*\(/i,
    suggestion: { icon: '🌐', text: '确认API参数和错误处理', priority: 'high' },
    reasonTemplate: '检测到API调用',
  },
  {
    name: 'database',
    pattern: /\b(SELECT|INSERT|UPDATE|DELETE|query|findOne|findMany|prisma|mongoose)\b/i,
    suggestion: { icon: '🗄️', text: '检查数据库操作安全性', priority: 'high' },
    reasonTemplate: '检测到数据库操作',
  },
  {
    name: 'async_await',
    pattern: /\b(async|await|Promise|\.then\()\b/,
    suggestion: { icon: '⏳', text: '检查异步错误处理', priority: 'medium' },
    reasonTemplate: '检测到异步操作',
  },
  {
    name: 'regex',
    pattern: /new RegExp|\/[^/]+\/[gimsuy]*/,
    suggestion: { icon: '🔍', text: '测试正则表达式边界情况', priority: 'medium' },
    reasonTemplate: '检测到正则表达式',
  },
  {
    name: 'error_handling',
    pattern: /\b(try|catch|throw|Error)\b/,
    suggestion: { icon: '⚠️', text: '验证异常处理完整性', priority: 'medium' },
    reasonTemplate: '检测到错误处理',
  },
  {
    name: 'file_operation',
    pattern: /\b(readFile|writeFile|fs\.|open\(|close\(|path\.)/i,
    suggestion: { icon: '📁', text: '检查文件路径和权限', priority: 'high' },
    reasonTemplate: '检测到文件操作',
  },
  {
    name: 'auth_security',
    pattern: /\b(password|token|auth|secret|credential|jwt|session)\b/i,
    suggestion: { icon: '🔐', text: '审查安全敏感代码', priority: 'high' },
    reasonTemplate: '检测到安全敏感内容',
  },

  // Data patterns
  {
    name: 'numbers_stats',
    pattern: /\d+(\.\d+)?%|\d{4,}|\b(统计|数据|比例|平均|总计)\b/,
    suggestion: { icon: '📊', text: '核实数据来源准确性', priority: 'high' },
    reasonTemplate: '检测到数字/统计数据',
  },
  {
    name: 'dates',
    pattern: /\b(20[0-2]\d年|\d{4}-\d{2}-\d{2}|最近|去年|今年)\b/,
    suggestion: { icon: '📅', text: '确认信息时效性', priority: 'medium' },
    reasonTemplate: '检测到日期/时间信息',
  },

  // Uncertainty patterns
  {
    name: 'uncertainty',
    pattern: /\b(可能|也许|大概|我认为|似乎|或许|不确定|maybe|probably|perhaps|might|could be)\b/i,
    suggestion: { icon: '❓', text: 'AI不确定，建议查证', priority: 'high' },
    reasonTemplate: '检测到不确定表述',
  },
  {
    name: 'assumption',
    pattern: /\b(假设|假定|如果.*那么|assuming|suppose)\b/i,
    suggestion: { icon: '💭', text: '验证假设条件是否成立', priority: 'medium' },
    reasonTemplate: '检测到假设条件',
  },

  // External reference patterns
  {
    name: 'library_reference',
    pattern: /\b(npm|pip|import|require|from\s+['"]|版本|version)\b/i,
    suggestion: { icon: '📦', text: '检查库版本兼容性', priority: 'medium' },
    reasonTemplate: '检测到外部库引用',
  },
  {
    name: 'url_link',
    pattern: /https?:\/\/[^\s]+/,
    suggestion: { icon: '🔗', text: '验证链接有效性', priority: 'low' },
    reasonTemplate: '检测到URL链接',
  },

  // Claim patterns
  {
    name: 'factual_claim',
    pattern: /\b(研究表明|据.*报道|根据|according to|research shows)\b/i,
    suggestion: { icon: '📰', text: '核实引用来源', priority: 'high' },
    reasonTemplate: '检测到事实性声明',
  },
  {
    name: 'recommendation',
    pattern: /\b(建议|推荐|最好|应该|recommend|should|best practice)\b/i,
    suggestion: { icon: '💡', text: '评估建议是否适合您的场景', priority: 'low' },
    reasonTemplate: '检测到建议/推荐',
  },
];

/**
 * Get action label based on trust score
 */
function getActionLabel(trustScore: number): string {
  if (trustScore >= 80) {
    return '快速检查即可';
  } else if (trustScore >= 60) {
    return '建议核实要点';
  } else if (trustScore >= 40) {
    return '请仔细审查';
  } else {
    return '建议专业验证';
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
 * Get trust level color based on score
 */
export function getTrustColor(trustScore: number): string {
  if (trustScore >= 80) {
    return '#22c55e'; // green
  } else if (trustScore >= 60) {
    return '#f59e0b'; // yellow/amber
  } else if (trustScore >= 40) {
    return '#f97316'; // orange
  } else {
    return '#ef4444'; // red
  }
}

/**
 * Analyze AI response content and generate specific suggestions
 */
export function analyzeContent(content: string, trustScore: number): ContentAnalysisResult {
  const suggestions: VerificationSuggestion[] = [];
  const detectedPatterns: string[] = [];

  // Run all detection rules
  for (const rule of DETECTION_RULES) {
    if (rule.pattern.test(content)) {
      detectedPatterns.push(rule.name);
      suggestions.push({
        ...rule.suggestion,
        reason: rule.reasonTemplate,
      });
    }
  }

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top 4 suggestions to avoid overwhelming users
  const limitedSuggestions = suggestions.slice(0, 4);

  return {
    suggestions: limitedSuggestions,
    detectedPatterns,
    actionLabel: getActionLabel(trustScore),
  };
}

/**
 * Get a brief summary for tooltip
 */
export function getSummaryText(trustScore: number, suggestionsCount: number): string {
  const actionLabel = getActionLabel(trustScore);
  if (suggestionsCount === 0) {
    return actionLabel;
  }
  return `${actionLabel} (${suggestionsCount}项)`;
}
