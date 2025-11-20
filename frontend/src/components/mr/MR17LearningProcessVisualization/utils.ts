/**
 * MR17: Learning Process Visualization - Utilities
 *
 * Visualize abstract learning progress and competency growth over time.
 * Focuses on Pattern E (Teaching & Learning) users
 * Evidence: Metacognitive visualization shows broad benefits in learning outcomes
 */

export type CapabilityDimension = 'independence' | 'speed' | 'quality' | 'creativity' | 'consistency';
export type TaskType = 'coding' | 'writing' | 'analysis' | 'design' | 'math' | 'research' | 'creative' | 'planning';

export interface ConceptNode {
  id: string;
  label: string;
  category: string;
  confidence: number; // 0-1
  firstEncountered: Date;
  lastReinforced: Date;
  connectionCount: number; // how many other concepts connected
  depth: 'basic' | 'intermediate' | 'advanced';
}

export interface KnowledgeGraph {
  sessionId: string;
  timestamp: Date;
  concepts: ConceptNode[];
  connections: Array<{
    source: string;
    target: string;
    strength: number; // 0-1
  }>;
  newConceptsIntroduced: number;
  conceptsReinforced: number;
  avgConceptConfidence: number;
}

export interface CapabilityTrajectory {
  taskType: TaskType;
  dimension: CapabilityDimension;
  baseline: number; // 0-100
  current: number; // 0-100
  change: number; // percentage change
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: Array<{ date: Date; value: number }>;
  velocity: number; // rate of change per week
}

export interface MetacognitiveMetrics {
  verificationRate: number; // 0-1 what % of outputs verified
  reflectionDepth: number; // 1-5 scale of thinking depth
  reflectionFrequency: number; // sessions with reflection / total sessions
  strategyDiversity: number; // 0-1 variety of strategies used
  strategyCount: number; // total unique strategies
  strategiesUsed: string[];
  learningVelocity: number; // concepts learned per week
  conceptComprehension: number; // avg confidence of new concepts
}

export interface LearningSession {
  sessionId: string;
  timestamp: Date;
  taskType: TaskType;
  duration: number; // minutes
  outputQuality: number; // 1-5 rating
  conceptsIntroduced: number;
  conceptsReinforced: number;
  verificationPerformed: boolean;
  reflectionNotes: string;
  strategiesUsed: string[];
  independenceScore: number; // 0-100
}

export interface LearningMilestone {
  id: string;
  timestamp: Date;
  type: 'breakthrough' | 'consolidation' | 'specialization' | 'integration';
  description: string;
  relevantConcepts: string[];
  capabilityImprovement: string;
  estimatedImpact: 'minor' | 'moderate' | 'major';
}

/**
 * Build knowledge graph from learning sessions
 */
export function buildKnowledgeGraph(sessions: LearningSession[]): KnowledgeGraph {
  const conceptMap = new Map<string, ConceptNode>();
  let newConceptsIntroduced = 0;
  let conceptsReinforced = 0;

  // Process sessions to extract concepts
  sessions.forEach(session => {
    newConceptsIntroduced += session.conceptsIntroduced;
    conceptsReinforced += session.conceptsReinforced;

    // Sample concept nodes (in real implementation, would extract from AI output)
    const sampleConcepts = generateSampleConcepts(session.taskType);
    sampleConcepts.forEach(concept => {
      const existing = conceptMap.get(concept.id);
      if (existing) {
        existing.connectionCount++;
        existing.lastReinforced = new Date();
        existing.confidence = Math.min(1, existing.confidence + 0.05);
      } else {
        conceptMap.set(concept.id, concept);
      }
    });
  });

  // Generate connections between concepts
  const concepts = Array.from(conceptMap.values());
  const connections = generateConceptConnections(concepts);

  const avgConceptConfidence =
    concepts.length > 0
      ? concepts.reduce((sum, c) => sum + c.confidence, 0) / concepts.length
      : 0;

  return {
    sessionId: `graph-${Date.now()}`,
    timestamp: new Date(),
    concepts,
    connections,
    newConceptsIntroduced,
    conceptsReinforced,
    avgConceptConfidence
  };
}

/**
 * Generate sample concepts based on task type
 */
function generateSampleConcepts(taskType: TaskType): ConceptNode[] {
  const concepts: Record<TaskType, Omit<ConceptNode, 'depth'>[]> = {
    coding: [
      { id: 'loops', label: 'Loops', category: 'control-flow', confidence: 0.8, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'recursion', label: 'Recursion', category: 'control-flow', confidence: 0.6, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'data-structures', label: 'Data Structures', category: 'algorithms', confidence: 0.7, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    writing: [
      { id: 'thesis', label: 'Thesis Statement', category: 'structure', confidence: 0.85, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'tone', label: 'Tone & Voice', category: 'style', confidence: 0.7, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'evidence', label: 'Evidence Integration', category: 'argumentation', confidence: 0.75, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    analysis: [
      { id: 'hypothesis', label: 'Hypothesis Formation', category: 'reasoning', confidence: 0.7, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'causation', label: 'Causation vs Correlation', category: 'logic', confidence: 0.65, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    design: [
      { id: 'user-research', label: 'User Research', category: 'discovery', confidence: 0.8, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'iteration', label: 'Design Iteration', category: 'process', confidence: 0.75, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    math: [
      { id: 'algebra', label: 'Algebra', category: 'fundamentals', confidence: 0.9, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'calculus', label: 'Calculus', category: 'advanced', confidence: 0.6, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    research: [
      { id: 'literature-review', label: 'Literature Review', category: 'methodology', confidence: 0.75, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'source-evaluation', label: 'Source Evaluation', category: 'critical-thinking', confidence: 0.8, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    creative: [
      { id: 'brainstorming', label: 'Brainstorming', category: 'ideation', confidence: 0.7, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'critique', label: 'Constructive Critique', category: 'feedback', confidence: 0.65, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ],
    planning: [
      { id: 'dependency-mapping', label: 'Dependency Mapping', category: 'structure', confidence: 0.8, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 },
      { id: 'risk-assessment', label: 'Risk Assessment', category: 'analysis', confidence: 0.7, firstEncountered: new Date(), lastReinforced: new Date(), connectionCount: 0 }
    ]
  };

  return (concepts[taskType] || []).map(c => ({
    ...c,
    depth: c.confidence > 0.8 ? 'advanced' : c.confidence > 0.5 ? 'intermediate' : 'basic'
  }));
}

/**
 * Generate connections between concepts
 */
function generateConceptConnections(
  concepts: ConceptNode[]
): Array<{ source: string; target: string; strength: number }> {
  const connections: Array<{ source: string; target: string; strength: number }> = [];

  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      // Concepts in same category have stronger connections
      const sameCategory = concepts[i].category === concepts[j].category;
      const strength = sameCategory ? 0.8 : 0.4;

      connections.push({
        source: concepts[i].id,
        target: concepts[j].id,
        strength
      });
    }
  }

  return connections;
}

/**
 * Calculate capability trajectories across dimensions
 */
export function calculateCapabilityTrajectories(
  sessions: LearningSession[]
): CapabilityTrajectory[] {
  const taskTypes = Array.from(new Set(sessions.map(s => s.taskType)));
  const dimensions: CapabilityDimension[] = ['independence', 'speed', 'quality', 'creativity', 'consistency'];

  const trajectories: CapabilityTrajectory[] = [];

  taskTypes.forEach(taskType => {
    const taskSessions = sessions.filter(s => s.taskType === taskType).sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (taskSessions.length < 2) return;

    dimensions.forEach(dimension => {
      const dataPoints = taskSessions.map(session => ({
        date: session.timestamp,
        value: calculateDimensionValue(session, dimension)
      }));

      const baseline = dataPoints[0].value;
      const current = dataPoints[dataPoints.length - 1].value;
      const change = ((current - baseline) / baseline) * 100;

      // Calculate trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (change > 5) trend = 'improving';
      else if (change < -5) trend = 'declining';

      // Calculate velocity (value change per week)
      const weeksElapsed = (dataPoints[dataPoints.length - 1].date.getTime() - dataPoints[0].date.getTime()) /
        (1000 * 60 * 60 * 24 * 7);
      const velocity = weeksElapsed > 0 ? change / weeksElapsed : 0;

      trajectories.push({
        taskType,
        dimension,
        baseline,
        current,
        change,
        trend,
        dataPoints,
        velocity
      });
    });
  });

  return trajectories;
}

/**
 * Calculate capability value for a dimension
 */
function calculateDimensionValue(session: LearningSession, dimension: CapabilityDimension): number {
  switch (dimension) {
    case 'independence':
      return session.independenceScore;
    case 'speed':
      // Higher speed = faster completion with quality output (inverse relationship with duration)
      return Math.max(0, 100 - (session.duration / 60) * 20);
    case 'quality':
      return session.outputQuality * 20; // 1-5 scale to 0-100
    case 'creativity':
      // Proxy: strategy diversity in this session
      return Math.min(100, session.strategiesUsed.length * 15);
    case 'consistency':
      // Consistency improves with stable performance across sessions
      return session.outputQuality >= 4 ? 90 : session.outputQuality >= 3 ? 70 : 50;
  }
}

/**
 * Calculate metacognitive metrics
 */
export function calculateMetacognitiveMetrics(sessions: LearningSession[]): MetacognitiveMetrics {
  if (sessions.length === 0) {
    return {
      verificationRate: 0,
      reflectionDepth: 1,
      reflectionFrequency: 0,
      strategyDiversity: 0,
      strategyCount: 0,
      strategiesUsed: [],
      learningVelocity: 0,
      conceptComprehension: 0
    };
  }

  // Verification rate
  const verificationCount = sessions.filter(s => s.verificationPerformed).length;
  const verificationRate = verificationCount / sessions.length;

  // Reflection depth (based on reflection notes quality)
  const avgReflectionDepth = sessions.reduce((sum, s) => {
    const notesLength = s.reflectionNotes?.length || 0;
    return sum + (notesLength > 100 ? 5 : notesLength > 50 ? 3 : 2);
  }, 0) / sessions.length;

  // Reflection frequency
  const reflectionCount = sessions.filter(s => s.reflectionNotes && s.reflectionNotes.length > 0).length;
  const reflectionFrequency = reflectionCount / sessions.length;

  // Strategy analysis
  const allStrategies = new Set<string>();
  sessions.forEach(s => s.strategiesUsed.forEach(st => allStrategies.add(st)));
  const strategiesUsed = Array.from(allStrategies);
  const strategyCount = strategiesUsed.length;
  const strategyDiversity = Math.min(1, strategyCount / 10); // 10+ different strategies = 100%

  // Learning velocity
  const weeksOfData = sessions.length > 0
    ? (sessions[sessions.length - 1].timestamp.getTime() - sessions[0].timestamp.getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 0;
  const totalConceptsIntroduced = sessions.reduce((sum, s) => sum + s.conceptsIntroduced, 0);
  const learningVelocity = weeksOfData > 0 ? totalConceptsIntroduced / weeksOfData : 0;

  // Concept comprehension
  const totalConcepts = totalConceptsIntroduced + sessions.reduce((sum, s) => sum + s.conceptsReinforced, 0);
  const conceptComprehension = totalConcepts > 0 ? (totalConceptsIntroduced - totalConceptsIntroduced * 0.3) / totalConcepts : 0;

  return {
    verificationRate,
    reflectionDepth: Math.round(avgReflectionDepth),
    reflectionFrequency,
    strategyDiversity,
    strategyCount,
    strategiesUsed,
    learningVelocity,
    conceptComprehension: Math.min(1, conceptComprehension)
  };
}

/**
 * Identify learning milestones
 */
export function identifyLearningMilestones(
  trajectories: CapabilityTrajectory[],
  sessions: LearningSession[]
): LearningMilestone[] {
  const milestones: LearningMilestone[] = [];

  // Breakthrough: significant improvement in a dimension
  trajectories.forEach(trajectory => {
    if (trajectory.trend === 'improving' && trajectory.change > 30) {
      milestones.push({
        id: `breakthrough-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type: 'breakthrough',
        description: `Breakthrough in ${trajectory.dimension} for ${trajectory.taskType}`,
        relevantConcepts: [],
        capabilityImprovement: `${trajectory.dimension} improved by ${Math.round(trajectory.change)}%`,
        estimatedImpact: 'major'
      });
    }
  });

  // Consolidation: stable performance over time
  const recentSessions = sessions.slice(-5);
  const qualityAvg = recentSessions.reduce((sum, s) => sum + s.outputQuality, 0) / recentSessions.length;
  if (qualityAvg >= 4) {
    milestones.push({
      id: `consolidation-${Date.now()}`,
      timestamp: new Date(),
      type: 'consolidation',
      description: 'Consistent high-quality output achieved',
      relevantConcepts: recentSessions.flatMap(s => s.strategiesUsed),
      capabilityImprovement: 'Consolidating knowledge into stable skills',
      estimatedImpact: 'moderate'
    });
  }

  // Specialization: focus on specific task type
  const taskTypeCounts = new Map<TaskType, number>();
  sessions.forEach(s => {
    taskTypeCounts.set(s.taskType, (taskTypeCounts.get(s.taskType) || 0) + 1);
  });

  const maxCount = Math.max(...taskTypeCounts.values());
  const specializedType = Array.from(taskTypeCounts.entries()).find(([_, count]) => count === maxCount)?.[0];

  if (specializedType && maxCount > sessions.length * 0.6) {
    milestones.push({
      id: `specialization-${Date.now()}`,
      timestamp: new Date(),
      type: 'specialization',
      description: `Specializing in ${specializedType}`,
      relevantConcepts: [],
      capabilityImprovement: `${Math.round((maxCount / sessions.length) * 100)}% of practice on ${specializedType}`,
      estimatedImpact: 'moderate'
    });
  }

  return milestones.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get learning summary
 */
export function getLearningFeedback(
  metrics: MetacognitiveMetrics,
  trajectories: CapabilityTrajectory[],
  milestones: LearningMilestone[]
): string {
  const feedback: string[] = [];

  if (metrics.reflectionFrequency > 0.7) {
    feedback.push('✅ Excellent reflection habit - you\'re developing metacognitive awareness');
  } else if (metrics.reflectionFrequency > 0.3) {
    feedback.push('👍 Good reflection practice. Increase reflection to deepen learning');
  } else {
    feedback.push('💡 Add reflection notes to deepen your learning and consolidate concepts');
  }

  if (metrics.verificationRate > 0.6) {
    feedback.push('✅ Strong verification habit - maintaining quality standards');
  } else if (metrics.verificationRate > 0.2) {
    feedback.push('📝 Increase verification to catch and fix errors early');
  } else {
    feedback.push('⚠️ Rarely verifying work - risk of accumulating errors');
  }

  if (metrics.strategyDiversity > 0.7) {
    feedback.push('✅ Excellent strategy diversity - adaptable to different challenges');
  } else if (metrics.strategyDiversity > 0.4) {
    feedback.push('🎯 Good variety. Explore more diverse approaches');
  } else {
    feedback.push('📚 Limited strategy variety - learn more techniques');
  }

  const improvingDimensions = trajectories.filter(t => t.trend === 'improving').length;
  if (improvingDimensions >= 3) {
    feedback.push('📈 Strong upward trends across multiple dimensions');
  }

  if (milestones.length > 0) {
    feedback.push(`🎉 ${milestones.length} learning milestone(s) achieved!`);
  }

  return feedback.join(' | ');
}

export default {
  buildKnowledgeGraph,
  calculateCapabilityTrajectories,
  calculateMetacognitiveMetrics,
  identifyLearningMilestones,
  getLearningFeedback
};
