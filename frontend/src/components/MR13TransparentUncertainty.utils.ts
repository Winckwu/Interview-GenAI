/**
 * MR13: Transparent Uncertainty Display - Utilities
 *
 * Explicitly communicate AI confidence levels and knowledge boundaries.
 * Address the universal user frustration (98%) with AI "pretending to be certain".
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type UncertaintyReason = 'limited-training-data' | 'knowledge-cutoff' | 'conflicting-sources' | 'reasoning-step' | 'domain-complexity' | 'not-trained';
export type SourceType = 'training-data' | 'reasoning' | 'retrieval' | 'unknown';
export type KnowledgeBoundary = 'well-known' | 'emerging' | 'specialized' | 'uncertain' | 'outdated';

export interface SentenceConfidence {
  id: string;
  text: string;
  confidence: number; // 0-1
  level: ConfidenceLevel;
  reasons: UncertaintyReason[];
  sourceType: SourceType;
  knowledgeBoundary: KnowledgeBoundary;
  requiresVerification: boolean;
  alternativesPossible: boolean;
}

export interface OutputUncertainty {
  id: string;
  fullText: string;
  overallConfidence: number; // 0-1
  overallLevel: ConfidenceLevel;
  sentences: SentenceConfidence[];
  keyUncertainties: string[];
  knowledgeCutoff: string;
  disclaimers: string[];
  verificationStrategies: string[];
  expertConsultationNeeded: boolean;
}

export interface ConfidenceHistory {
  timestamp: Date;
  query: string;
  response: string;
  uncertainty: OutputUncertainty;
  userVerification?: {
    wasCorrect: boolean;
    correctionsNeeded: string[];
  };
}

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  high: 0.75,
  medium: 0.5,
  low: 0
};

// Uncertainty reason explanations
const UNCERTAINTY_EXPLANATIONS: Record<UncertaintyReason, string> = {
  'limited-training-data': 'Limited training data available for this topic',
  'knowledge-cutoff': 'Information beyond my training cutoff date (January 2024)',
  'conflicting-sources': 'Conflicting information found in training data',
  'reasoning-step': 'This conclusion requires inference rather than direct knowledge',
  'domain-complexity': 'This is a complex domain with many variables',
  'not-trained': 'This specific topic was not well-represented in training'
};

const KNOWLEDGE_BOUNDARY_LABELS: Record<KnowledgeBoundary, string> = {
  'well-known': 'Well-established knowledge',
  'emerging': 'Emerging topic with ongoing research',
  'specialized': 'Requires specialized domain expertise',
  'uncertain': 'Uncertain or debated in my training data',
  'outdated': 'May be outdated due to knowledge cutoff'
};

/**
 * Analyze output and estimate confidence by sentence
 */
export function analyzeUncertainty(
  text: string,
  topic: string = 'general'
): OutputUncertainty {
  const sentences = splitIntoSentences(text);
  const sentenceConfidences = sentences.map((sentence, idx) =>
    analyzeSentenceConfidence(sentence, idx, topic)
  );

  // Calculate overall confidence
  const overallConfidence =
    sentenceConfidences.length > 0
      ? sentenceConfidences.reduce((sum, s) => sum + s.confidence, 0) /
        sentenceConfidences.length
      : 0.5;

  const overallLevel = getConfidenceLevel(overallConfidence);

  // Identify key uncertainties
  const keyUncertainties = identifyKeyUncertainties(sentenceConfidences);

  // Generate disclaimers
  const disclaimers = generateDisclaimers(topic, overallConfidence, sentenceConfidences);

  // Suggest verification strategies
  const verificationStrategies = suggestVerificationStrategies(
    sentenceConfidences,
    topic
  );

  // Check if expert consultation is needed
  const expertConsultationNeeded = overallConfidence < 0.5;

  return {
    id: `uncertainty-${Date.now()}`,
    fullText: text,
    overallConfidence,
    overallLevel,
    sentences: sentenceConfidences,
    keyUncertainties,
    knowledgeCutoff: 'January 2024',
    disclaimers,
    verificationStrategies,
    expertConsultationNeeded
  };
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
}

/**
 * Analyze confidence of a single sentence
 */
function analyzeSentenceConfidence(
  sentence: string,
  index: number,
  topic: string
): SentenceConfidence {
  let confidence = 0.75; // default
  const reasons: UncertaintyReason[] = [];
  let sourceType: SourceType = 'training-data';
  let knowledgeBoundary: KnowledgeBoundary = 'well-known';
  let requiresVerification = false;
  let alternativesPossible = false;

  const lowerSentence = sentence.toLowerCase();

  // Detect confidence indicators in sentence
  if (
    lowerSentence.includes('definitely') ||
    lowerSentence.includes('always') ||
    lowerSentence.includes('never')
  ) {
    confidence = 0.85;
  } else if (
    lowerSentence.includes('probably') ||
    lowerSentence.includes('likely') ||
    lowerSentence.includes('usually')
  ) {
    confidence = 0.65;
    reasons.push('reasoning-step');
  } else if (
    lowerSentence.includes('may') ||
    lowerSentence.includes('might') ||
    lowerSentence.includes('could')
  ) {
    confidence = 0.45;
    reasons.push('domain-complexity');
    alternativesPossible = true;
  } else if (
    lowerSentence.includes('uncertain') ||
    lowerSentence.includes('unclear') ||
    lowerSentence.includes('unclear')
  ) {
    confidence = 0.30;
    reasons.push('limited-training-data');
    requiresVerification = true;
  }

  // Detect date references (knowledge cutoff indicator)
  if (/20\d{2}|tomorrow|future|recent|recently/.test(lowerSentence)) {
    confidence = Math.max(0, confidence - 0.15);
    reasons.push('knowledge-cutoff');
    knowledgeBoundary = 'outdated';
    requiresVerification = true;
  }

  // Detect domain-specific topics
  if (
    /^(research|study|experiment|statistic|estimate|projection)/.test(
      lowerSentence
    )
  ) {
    confidence = Math.max(0, confidence - 0.1);
    reasons.push('domain-complexity');
    knowledgeBoundary = 'specialized';
  }

  // Detect conditional/reasoning statements
  if (
    /(based on|according to|suggests|indicates|implies|appears|seems)/.test(
      lowerSentence
    )
  ) {
    sourceType = 'reasoning';
    confidence = Math.max(0, confidence - 0.1);
  }

  // Clamp confidence to 0-1
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    id: `sentence-${Date.now()}-${index}`,
    text: sentence,
    confidence,
    level: getConfidenceLevel(confidence),
    reasons,
    sourceType,
    knowledgeBoundary,
    requiresVerification,
    alternativesPossible
  };
}

/**
 * Get confidence level from numeric confidence
 */
function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Identify key uncertainties in the output
 */
function identifyKeyUncertainties(
  sentences: SentenceConfidence[]
): string[] {
  const uncertainties: string[] = [];

  // Find sentences with low confidence
  const lowConfidenceSentences = sentences.filter(s => s.level === 'low');
  if (lowConfidenceSentences.length > 0) {
    uncertainties.push(
      `${lowConfidenceSentences.length} statement(s) have low confidence`
    );
  }

  // Find sentences requiring verification
  const needsVerification = sentences.filter(s => s.requiresVerification);
  if (needsVerification.length > 0) {
    uncertainties.push(`${needsVerification.length} statement(s) require verification`);
  }

  // Find sentences with multiple alternatives
  const hasAlternatives = sentences.filter(s => s.alternativesPossible);
  if (hasAlternatives.length > 0) {
    uncertainties.push(
      `${hasAlternatives.length} statement(s) have possible alternatives`
    );
  }

  // Check for knowledge boundary issues
  const outdatedKnowledge = sentences.filter(
    s => s.knowledgeBoundary === 'outdated'
  );
  if (outdatedKnowledge.length > 0) {
    uncertainties.push(
      'Some information may be outdated (knowledge cutoff: January 2024)'
    );
  }

  return uncertainties;
}

/**
 * Generate disclaimers based on analysis
 */
function generateDisclaimers(
  topic: string,
  overallConfidence: number,
  sentences: SentenceConfidence[]
): string[] {
  const disclaimers: string[] = [];

  if (overallConfidence < 0.5) {
    disclaimers.push(
      '⚠️ Overall confidence is below 50%. Consider consulting additional sources.'
    );
  }

  if (topic.includes('medical') || topic.includes('health')) {
    disclaimers.push('⚠️ Medical information requires professional verification.');
  }

  if (topic.includes('legal') || topic.includes('law')) {
    disclaimers.push('⚠️ Legal information requires professional interpretation.');
  }

  if (topic.includes('finance') || topic.includes('investment')) {
    disclaimers.push('⚠️ Financial information may not be suitable for decisions.');
  }

  if (sentences.some(s => s.knowledgeBoundary === 'outdated')) {
    disclaimers.push('📅 Some information may be outdated.');
  }

  if (sentences.some(s => s.sourceType === 'reasoning')) {
    disclaimers.push('💭 Some statements involve inference rather than direct knowledge.');
  }

  return disclaimers;
}

/**
 * Suggest verification strategies
 */
function suggestVerificationStrategies(
  sentences: SentenceConfidence[],
  topic: string
): string[] {
  const strategies: string[] = [];

  // Find high-priority verification items
  const lowConfidence = sentences.filter(s => s.confidence < 0.5);
  if (lowConfidence.length > 0) {
    strategies.push('Verify key claims with external sources');
  }

  // Domain-specific strategies
  if (topic.includes('code') || topic.includes('programming')) {
    strategies.push('Test code in a development environment');
  }

  if (topic.includes('math') || topic.includes('calculation')) {
    strategies.push('Manually verify mathematical calculations');
  }

  if (topic.includes('fact') || topic.includes('statistic')) {
    strategies.push('Cross-reference with authoritative sources');
  }

  if (topic.includes('date') || topic.includes('recent')) {
    strategies.push('Check for updates beyond knowledge cutoff date');
  }

  strategies.push('Ask for sources or reasoning where confidence is low');

  return strategies;
}

/**
 * Create a confidence history entry
 */
export function createConfidenceHistory(
  query: string,
  response: string,
  uncertainty: OutputUncertainty
): ConfidenceHistory {
  return {
    timestamp: new Date(),
    query,
    response,
    uncertainty
  };
}

/**
 * Record user verification of a statement
 */
export function recordVerification(
  history: ConfidenceHistory,
  wasCorrect: boolean,
  corrections: string[] = []
): ConfidenceHistory {
  return {
    ...history,
    userVerification: {
      wasCorrect,
      correctionsNeeded: corrections
    }
  };
}

/**
 * Get visual confidence indicator (bars)
 */
export function getConfidenceBar(confidence: number, length: number = 5): string {
  const filled = Math.round(confidence * length);
  const empty = length - filled;
  return '■'.repeat(filled) + '□'.repeat(empty);
}

/**
 * Get color for confidence level
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  if (level === 'high') return '#4caf50'; // green
  if (level === 'medium') return '#ff9800'; // orange
  return '#f44336'; // red
}

/**
 * Get explanation for sentence uncertainty
 */
export function getUncertaintyExplanation(
  sentence: SentenceConfidence
): string[] {
  return sentence.reasons.map(
    reason => UNCERTAINTY_EXPLANATIONS[reason]
  );
}

/**
 * Get knowledge boundary description
 */
export function getKnowledgeBoundaryDescription(
  boundary: KnowledgeBoundary
): string {
  return KNOWLEDGE_BOUNDARY_LABELS[boundary];
}

export default {
  analyzeUncertainty,
  createConfidenceHistory,
  recordVerification,
  getConfidenceBar,
  getConfidenceColor,
  getUncertaintyExplanation,
  getKnowledgeBoundaryDescription
};
