/**
 * Mock Member Check Data
 * 20 simulated users with different AI usage patterns
 * 10 efficient users + 10 struggling users
 */

export interface MockUserProfile {
  userId: string;
  userName: string;
  userType: 'efficient' | 'struggling';
  actualPattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  secondaryPattern?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Secondary pattern for hybrid users
  aiQueryCount: number;
  verificationRate: number;
  independenceRate: number;
  taskCount: number;
  contextAware: boolean;
  contextualBehaviors?: Record<string, {
    pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    queryRatio: number;
    verificationRate: number;
  }>; // Context-specific behavior patterns
  patternSwitchingTriggers?: string[]; // What triggers pattern switching (e.g., "high complexity", "urgent deadline")
}

/**
 * Efficient Users (10)
 * Healthy AI usage patterns with good verification
 */
export const EFFICIENT_USERS: MockUserProfile[] = [
  {
    userId: 'eff_001',
    userName: '张思',
    userType: 'efficient',
    actualPattern: 'A',
    secondaryPattern: 'C', // Hybrid: Strategic Control + Context Adaptation
    aiQueryCount: 5,
    verificationRate: 0.92,
    independenceRate: 0.88,
    taskCount: 5,
    contextAware: true,
    contextualBehaviors: {
      'standard_task': { pattern: 'A', queryRatio: 0.8, verificationRate: 0.95 },
      'complex_task': { pattern: 'C', queryRatio: 1.2, verificationRate: 0.85 }
    },
    patternSwitchingTriggers: ['high_complexity', 'unfamiliar_domain']
  },
  {
    userId: 'eff_002',
    userName: '李梅',
    userType: 'efficient',
    actualPattern: 'A',
    aiQueryCount: 4,
    verificationRate: 0.95,
    independenceRate: 0.90,
    taskCount: 4,
    contextAware: false
  },
  {
    userId: 'eff_003',
    userName: '王刚',
    userType: 'efficient',
    actualPattern: 'B',
    secondaryPattern: 'D', // Hybrid: Iterative Refinement + Deep Verification
    aiQueryCount: 12,
    verificationRate: 0.72,
    independenceRate: 0.65,
    taskCount: 6,
    contextAware: true,
    contextualBehaviors: {
      'iterative_tasks': { pattern: 'B', queryRatio: 2.0, verificationRate: 0.70 },
      'critical_tasks': { pattern: 'D', queryRatio: 1.8, verificationRate: 0.90 }
    },
    patternSwitchingTriggers: ['task_criticality', 'risk_assessment']
  },
  {
    userId: 'eff_004',
    userName: '陈蕾',
    userType: 'efficient',
    actualPattern: 'B',
    aiQueryCount: 14,
    verificationRate: 0.75,
    independenceRate: 0.68,
    taskCount: 7,
    contextAware: false
  },
  {
    userId: 'eff_005',
    userName: '许军',
    userType: 'efficient',
    actualPattern: 'C',
    aiQueryCount: 8,
    verificationRate: 0.68,
    independenceRate: 0.72,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'eff_006',
    userName: '刘艳筝',
    userType: 'efficient',
    actualPattern: 'C',
    aiQueryCount: 7,
    verificationRate: 0.70,
    independenceRate: 0.75,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'eff_007',
    userName: '何帆',
    userType: 'efficient',
    actualPattern: 'D',
    aiQueryCount: 6,
    verificationRate: 0.88,
    independenceRate: 0.80,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'eff_008',
    userName: '周红',
    userType: 'efficient',
    actualPattern: 'D',
    aiQueryCount: 5,
    verificationRate: 0.85,
    independenceRate: 0.78,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'eff_009',
    userName: '唐明',
    userType: 'efficient',
    actualPattern: 'E',
    aiQueryCount: 10,
    verificationRate: 0.70,
    independenceRate: 0.75,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'eff_010',
    userName: '黄晶',
    userType: 'efficient',
    actualPattern: 'E',
    aiQueryCount: 11,
    verificationRate: 0.68,
    independenceRate: 0.72,
    taskCount: 5,
    contextAware: false
  }
];

/**
 * Struggling Users (10)
 * Users with concerning AI usage patterns
 */
export const STRUGGLING_USERS: MockUserProfile[] = [
  {
    userId: 'str_001',
    userName: '杨虹',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 28,
    verificationRate: 0.18,
    independenceRate: 0.15,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_002',
    userName: '吴海',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 32,
    verificationRate: 0.12,
    independenceRate: 0.10,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_003',
    userName: '郑欢',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 25,
    verificationRate: 0.22,
    independenceRate: 0.20,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_004',
    userName: '何晓',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 30,
    verificationRate: 0.15,
    independenceRate: 0.12,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_005',
    userName: '邱源',
    userType: 'struggling',
    actualPattern: 'B',
    secondaryPattern: 'A', // Hybrid: Iterative Refinement + Strategic Control (attempting)
    aiQueryCount: 18,
    verificationRate: 0.42,
    independenceRate: 0.45,
    taskCount: 6,
    contextAware: true,
    contextualBehaviors: {
      'familiar_tasks': { pattern: 'A', queryRatio: 0.9, verificationRate: 0.65 },
      'new_tasks': { pattern: 'B', queryRatio: 3.0, verificationRate: 0.30 }
    },
    patternSwitchingTriggers: ['task_familiarity', 'confidence_level']
  },
  {
    userId: 'str_006',
    userName: '任昱',
    userType: 'struggling',
    actualPattern: 'B',
    aiQueryCount: 20,
    verificationRate: 0.38,
    independenceRate: 0.40,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'str_007',
    userName: '韩雪',
    userType: 'struggling',
    actualPattern: 'C',
    secondaryPattern: 'B', // Hybrid: Context-Aware + Iterative (struggling with balance)
    aiQueryCount: 10,
    verificationRate: 0.42,
    independenceRate: 0.45,
    taskCount: 8,
    contextAware: true,
    contextualBehaviors: {
      'adaptive_approach': { pattern: 'C', queryRatio: 1.25, verificationRate: 0.45 },
      'fallback_iterative': { pattern: 'B', queryRatio: 1.5, verificationRate: 0.35 }
    },
    patternSwitchingTriggers: ['adaptation_failure', 'increased_difficulty']
  },
  {
    userId: 'str_008',
    userName: '范丽',
    userType: 'struggling',
    actualPattern: 'C',
    aiQueryCount: 9,
    verificationRate: 0.40,
    independenceRate: 0.42,
    taskCount: 8,
    contextAware: true // Context-aware user
  },
  {
    userId: 'str_009',
    userName: '孙岭',
    userType: 'struggling',
    actualPattern: 'A',
    aiQueryCount: 5,
    verificationRate: 0.88,
    independenceRate: 0.80,
    taskCount: 5,
    contextAware: false // Pattern A with good verification but less independence
  },
  {
    userId: 'str_010',
    userName: '曾茵',
    userType: 'struggling',
    actualPattern: 'C',
    secondaryPattern: 'E', // Hybrid: Context-Aware + Learning-Focused
    aiQueryCount: 11,
    verificationRate: 0.45,
    independenceRate: 0.42,
    taskCount: 8,
    contextAware: true,
    contextualBehaviors: {
      'learning_phase': { pattern: 'E', queryRatio: 2.2, verificationRate: 0.40 },
      'application_phase': { pattern: 'C', queryRatio: 1.0, verificationRate: 0.50 }
    },
    patternSwitchingTriggers: ['learning_stage', 'knowledge_consolidation']
  }
];

/**
 * Expected detection results based on behavior
 * Maps user to what the system should detect
 */
export const EXPECTED_DETECTIONS: Record<string, string> = {
  // Efficient users - should detect correctly
  'eff_001': 'A', // High verification (primary)
  'eff_002': 'A', // Very high verification
  'eff_003': 'B', // Multiple queries with verification (primary)
  'eff_004': 'B', // Multiple queries with verification
  'eff_005': 'C', // Context-aware
  'eff_006': 'C', // Context-aware
  'eff_007': 'D', // Deep verification focus
  'eff_008': 'D', // Deep verification focus
  'eff_009': 'E', // Teaching-focused
  'eff_010': 'E', // Teaching-focused

  // Struggling users - should detect correctly
  'str_001': 'F', // Clear over-reliance
  'str_002': 'F', // Very clear over-reliance
  'str_003': 'F', // Clear over-reliance
  'str_004': 'F', // Clear over-reliance
  'str_005': 'B', // Some verification but lower (primary)
  'str_006': 'B', // Some verification but lower
  'str_007': 'C', // Might be misclassified as B without context awareness (primary)
  'str_008': 'C', // Might be misclassified as B without context awareness
  'str_009': 'A', // Pattern A with good verification
  'str_010': 'C'  // Pattern C with context switching (primary)
};

/**
 * Expected hybrid pattern detections
 * Maps hybrid users to their secondary patterns
 * Hybrid users: eff_001 (A+C), eff_003 (B+D), str_005 (B+A), str_007 (C+B), str_010 (C+E)
 */
export const EXPECTED_HYBRID_PATTERNS: Record<string, string> = {
  'eff_001': 'C', // Secondary: Context adaptation when complexity increases
  'eff_003': 'D', // Secondary: Deep verification for critical tasks
  'str_005': 'A', // Secondary: Strategic control for familiar tasks
  'str_007': 'B', // Secondary: Falls back to iteration when adaptation fails
  'str_010': 'E'  // Secondary: Learning-focused in early phases
};

/**
 * Non-hybrid users (should not have secondary patterns)
 */
export const NON_HYBRID_USERS = [
  'eff_002', 'eff_004', 'eff_005', 'eff_006', 'eff_007', 'eff_008', 'eff_009', 'eff_010',
  'str_001', 'str_002', 'str_003', 'str_004', 'str_006', 'str_008', 'str_009'
];

/**
 * All 20 users combined
 */
export const ALL_MOCK_USERS: MockUserProfile[] = [
  ...EFFICIENT_USERS,
  ...STRUGGLING_USERS
];

/**
 * Get user by ID
 */
export function getMockUserById(userId: string): MockUserProfile | undefined {
  return ALL_MOCK_USERS.find((u) => u.userId === userId);
}

/**
 * Get random user sample
 */
export function getRandomUsers(count: number): MockUserProfile[] {
  const shuffled = [...ALL_MOCK_USERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, ALL_MOCK_USERS.length));
}
