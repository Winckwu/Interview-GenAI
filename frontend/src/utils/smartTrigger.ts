/**
 * Smart Trigger Detection Utility
 *
 * Detects when AI responses contain content worth exploring
 * Used to show contextual suggestions for MR2 insights
 *
 * Detection rules:
 * - Decision/recommendation: keywords like "建议", "推荐", "should", "recommend"
 * - Complex explanation: length > 500, technical terms
 * - Code: code blocks present
 * - Lists: multiple list items suggesting options
 */

export interface SmartTriggerResult {
  shouldTrigger: boolean;
  triggerType: 'decision' | 'complex' | 'code' | 'options' | 'creative' | null;
  confidence: number; // 0-1
  suggestion: string; // The suggestion text to show
}

// Keywords indicating decisions/recommendations
const DECISION_KEYWORDS = [
  // English
  'recommend', 'suggest', 'should', 'better to', 'best option', 'advise',
  'consider', 'it\'s best', 'would be better', 'i think', 'in my opinion',
  'the best approach', 'optimal', 'prefer', 'ideal',
  // Chinese
  '建议', '推荐', '应该', '最好', '更好的', '选择', '方案',
  '可以考虑', '最佳', '优先', '首选', '倾向于'
];

// Keywords indicating complex technical content
const TECHNICAL_KEYWORDS = [
  'algorithm', 'function', 'implementation', 'architecture', 'database',
  'api', 'interface', 'protocol', 'framework', 'pattern', 'component',
  'async', 'promise', 'callback', 'hook', 'state', 'props', 'context',
  '算法', '函数', '实现', '架构', '数据库', '接口', '协议', '框架',
  '模式', '组件', '异步', '状态', '属性'
];

/**
 * Detect if content contains code blocks
 */
function hasCodeBlocks(content: string): boolean {
  // Check for markdown code blocks (``` or ` `)
  return /```[\s\S]*?```/g.test(content) || /`[^`]+`/g.test(content);
}

/**
 * Detect if content contains lists with multiple options
 */
function hasMultipleOptions(content: string): boolean {
  // Check for numbered lists (1. 2. 3.) or bullet points (- or *)
  const numberedItems = content.match(/^\s*\d+\.\s/gm);
  const bulletItems = content.match(/^\s*[-*•]\s/gm);

  const itemCount = (numberedItems?.length || 0) + (bulletItems?.length || 0);
  return itemCount >= 3; // At least 3 list items
}

/**
 * Detect if content contains decision/recommendation keywords
 */
function hasDecisionKeywords(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return DECISION_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

/**
 * Detect if content is complex (long with technical terms)
 */
function isComplexContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const hasTechnicalTerms = TECHNICAL_KEYWORDS.some(keyword =>
    lowerContent.includes(keyword.toLowerCase())
  );
  return content.length > 500 && hasTechnicalTerms;
}

/**
 * Main detection function
 */
export function detectSmartTrigger(content: string): SmartTriggerResult {
  // Skip short responses
  if (!content || content.length < 100) {
    return { shouldTrigger: false, triggerType: null, confidence: 0, suggestion: '' };
  }

  // Check for code blocks - highest priority
  if (hasCodeBlocks(content)) {
    return {
      shouldTrigger: true,
      triggerType: 'code',
      confidence: 0.9,
      suggestion: '💡 Code detected - click Insights to check for issues or get explanations'
    };
  }

  // Check for decisions/recommendations
  if (hasDecisionKeywords(content)) {
    const hasOptions = hasMultipleOptions(content);
    if (hasOptions) {
      return {
        shouldTrigger: true,
        triggerType: 'options',
        confidence: 0.95,
        suggestion: '💡 Multiple options presented - click Insights to compare and decide'
      };
    }
    return {
      shouldTrigger: true,
      triggerType: 'decision',
      confidence: 0.85,
      suggestion: '💡 Recommendation made - click Insights to explore alternatives'
    };
  }

  // Check for complex explanations
  if (isComplexContent(content)) {
    return {
      shouldTrigger: true,
      triggerType: 'complex',
      confidence: 0.8,
      suggestion: '💡 Complex topic - click Insights for key points and follow-ups'
    };
  }

  // Check for lists/options without explicit recommendation
  if (hasMultipleOptions(content) && content.length > 200) {
    return {
      shouldTrigger: true,
      triggerType: 'options',
      confidence: 0.75,
      suggestion: '💡 Multiple points listed - click Insights for summary'
    };
  }

  return { shouldTrigger: false, triggerType: null, confidence: 0, suggestion: '' };
}

/**
 * Get CSS class for smart trigger indicator
 */
export function getSmartTriggerClass(triggerType: SmartTriggerResult['triggerType']): string {
  switch (triggerType) {
    case 'code':
      return 'smart-trigger-code';
    case 'decision':
      return 'smart-trigger-decision';
    case 'options':
      return 'smart-trigger-options';
    case 'complex':
      return 'smart-trigger-complex';
    default:
      return '';
  }
}
