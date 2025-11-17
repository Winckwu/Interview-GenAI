/**
 * Extended Mock Users Dataset (N=50+)
 * Representative sample with increased diversity
 * Includes original 20 users + 30 additional users for advanced testing
 */

import { MockUserProfile } from './mock-member-check-data';

/**
 * Additional 30 users (N=30) to expand original 20 to N=50
 * Maintains 20-30% hybrid pattern distribution
 * Increases diversity in behavior patterns
 */
export const ADDITIONAL_MOCK_USERS: MockUserProfile[] = [
  // Additional Efficient Users (N=10)
  {
    userId: 'eff_011',
    userName: '苏燕',
    userType: 'efficient',
    actualPattern: 'A',
    aiQueryCount: 3,
    verificationRate: 0.96,
    independenceRate: 0.92,
    taskCount: 4,
    contextAware: false
  },
  {
    userId: 'eff_012',
    userName: '邓刚',
    userType: 'efficient',
    actualPattern: 'B',
    secondaryPattern: 'A',
    aiQueryCount: 10,
    verificationRate: 0.78,
    independenceRate: 0.70,
    taskCount: 5,
    contextAware: true,
    contextualBehaviors: {
      'simple_task': { pattern: 'A', queryRatio: 0.7, verificationRate: 0.92 },
      'complex_task': { pattern: 'B', queryRatio: 2.0, verificationRate: 0.68 }
    },
    patternSwitchingTriggers: ['task_complexity', 'deadline_pressure']
  },
  {
    userId: 'eff_013',
    userName: '顾梅',
    userType: 'efficient',
    actualPattern: 'C',
    aiQueryCount: 8,
    verificationRate: 0.65,
    independenceRate: 0.73,
    taskCount: 7,
    contextAware: true
  },
  {
    userId: 'eff_014',
    userName: '傅军',
    userType: 'efficient',
    actualPattern: 'D',
    secondaryPattern: 'B',
    aiQueryCount: 7,
    verificationRate: 0.82,
    independenceRate: 0.75,
    taskCount: 5,
    contextAware: true,
    contextualBehaviors: {
      'learning_task': { pattern: 'D', queryRatio: 1.4, verificationRate: 0.88 },
      'routine_task': { pattern: 'B', queryRatio: 1.8, verificationRate: 0.70 }
    },
    patternSwitchingTriggers: ['novelty_level', 'familiarity_score']
  },
  {
    userId: 'eff_015',
    userName: '侯静',
    userType: 'efficient',
    actualPattern: 'E',
    aiQueryCount: 9,
    verificationRate: 0.72,
    independenceRate: 0.68,
    taskCount: 4,
    contextAware: false
  },
  {
    userId: 'eff_016',
    userName: '江鹏',
    userType: 'efficient',
    actualPattern: 'A',
    aiQueryCount: 4,
    verificationRate: 0.91,
    independenceRate: 0.87,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'eff_017',
    userName: '柯茹',
    userType: 'efficient',
    actualPattern: 'B',
    aiQueryCount: 11,
    verificationRate: 0.73,
    independenceRate: 0.66,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'eff_018',
    userName: '龙静',
    userType: 'efficient',
    actualPattern: 'C',
    aiQueryCount: 7,
    verificationRate: 0.68,
    independenceRate: 0.74,
    taskCount: 7,
    contextAware: true
  },
  {
    userId: 'eff_019',
    userName: '罗燕',
    userType: 'efficient',
    actualPattern: 'D',
    aiQueryCount: 6,
    verificationRate: 0.87,
    independenceRate: 0.79,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'eff_020',
    userName: '莫群',
    userType: 'efficient',
    actualPattern: 'E',
    aiQueryCount: 10,
    verificationRate: 0.71,
    independenceRate: 0.73,
    taskCount: 5,
    contextAware: false
  },

  // Additional Struggling Users (N=20)
  {
    userId: 'str_011',
    userName: '彭军',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 27,
    verificationRate: 0.20,
    independenceRate: 0.18,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_012',
    userName: '秦军',
    userType: 'struggling',
    actualPattern: 'B',
    secondaryPattern: 'F',
    aiQueryCount: 16,
    verificationRate: 0.48,
    independenceRate: 0.50,
    taskCount: 6,
    contextAware: true,
    contextualBehaviors: {
      'familiar_context': { pattern: 'B', queryRatio: 2.2, verificationRate: 0.52 },
      'new_context': { pattern: 'F', queryRatio: 3.0, verificationRate: 0.28 }
    },
    patternSwitchingTriggers: ['unknown_territory', 'stress_level']
  },
  {
    userId: 'str_013',
    userName: '任群',
    userType: 'struggling',
    actualPattern: 'C',
    aiQueryCount: 11,
    verificationRate: 0.43,
    independenceRate: 0.44,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'str_014',
    userName: '孙欣',
    userType: 'struggling',
    actualPattern: 'A',
    aiQueryCount: 6,
    verificationRate: 0.85,
    independenceRate: 0.78,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'str_015',
    userName: '唐思',
    userType: 'struggling',
    actualPattern: 'C',
    secondaryPattern: 'E',
    aiQueryCount: 12,
    verificationRate: 0.46,
    independenceRate: 0.43,
    taskCount: 8,
    contextAware: true,
    contextualBehaviors: {
      'learning_phase': { pattern: 'E', queryRatio: 2.4, verificationRate: 0.42 },
      'practice_phase': { pattern: 'C', queryRatio: 1.0, verificationRate: 0.50 }
    },
    patternSwitchingTriggers: ['learning_stage', 'skill_development']
  },
  {
    userId: 'str_016',
    userName: '翁鑫',
    userType: 'struggling',
    actualPattern: 'B',
    aiQueryCount: 19,
    verificationRate: 0.41,
    independenceRate: 0.43,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'str_017',
    userName: '习鹏',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 29,
    verificationRate: 0.16,
    independenceRate: 0.14,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_018',
    userName: '肖群',
    userType: 'struggling',
    actualPattern: 'C',
    aiQueryCount: 10,
    verificationRate: 0.44,
    independenceRate: 0.46,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'str_019',
    userName: '严涛',
    userType: 'struggling',
    actualPattern: 'B',
    secondaryPattern: 'C',
    aiQueryCount: 17,
    verificationRate: 0.43,
    independenceRate: 0.44,
    taskCount: 6,
    contextAware: true,
    contextualBehaviors: {
      'iterative_mode': { pattern: 'B', queryRatio: 2.8, verificationRate: 0.40 },
      'adaptive_mode': { pattern: 'C', queryRatio: 1.5, verificationRate: 0.48 }
    },
    patternSwitchingTriggers: ['approach_change', 'feedback_response']
  },
  {
    userId: 'str_020',
    userName: '游欣',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 26,
    verificationRate: 0.19,
    independenceRate: 0.17,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_021',
    userName: '袁璇',
    userType: 'struggling',
    actualPattern: 'A',
    aiQueryCount: 5,
    verificationRate: 0.83,
    independenceRate: 0.76,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'str_022',
    userName: '张飞',
    userType: 'struggling',
    actualPattern: 'C',
    aiQueryCount: 10,
    verificationRate: 0.45,
    independenceRate: 0.45,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'str_023',
    userName: '郑英',
    userType: 'struggling',
    actualPattern: 'B',
    aiQueryCount: 18,
    verificationRate: 0.40,
    independenceRate: 0.42,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'str_024',
    userName: '周俊',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 31,
    verificationRate: 0.14,
    independenceRate: 0.12,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_025',
    userName: '朱欢',
    userType: 'struggling',
    actualPattern: 'C',
    aiQueryCount: 9,
    verificationRate: 0.42,
    independenceRate: 0.44,
    taskCount: 8,
    contextAware: true
  },
  {
    userId: 'str_026',
    userName: '贾茜',
    userType: 'struggling',
    actualPattern: 'A',
    aiQueryCount: 4,
    verificationRate: 0.87,
    independenceRate: 0.82,
    taskCount: 5,
    contextAware: false
  },
  {
    userId: 'str_027',
    userName: '金丽',
    userType: 'struggling',
    actualPattern: 'B',
    aiQueryCount: 17,
    verificationRate: 0.42,
    independenceRate: 0.43,
    taskCount: 6,
    contextAware: false
  },
  {
    userId: 'str_028',
    userName: '康智',
    userType: 'struggling',
    actualPattern: 'F',
    aiQueryCount: 28,
    verificationRate: 0.17,
    independenceRate: 0.15,
    taskCount: 10,
    contextAware: false
  },
  {
    userId: 'str_029',
    userName: '李君',
    userType: 'struggling',
    actualPattern: 'C',
    secondaryPattern: 'B',
    aiQueryCount: 10,
    verificationRate: 0.43,
    independenceRate: 0.43,
    taskCount: 8,
    contextAware: true,
    contextualBehaviors: {
      'adaptive_first': { pattern: 'C', queryRatio: 1.2, verificationRate: 0.45 },
      'iteration_fallback': { pattern: 'B', queryRatio: 1.6, verificationRate: 0.38 }
    },
    patternSwitchingTriggers: ['adaptation_difficulty', 'time_constraint']
  },
  {
    userId: 'str_030',
    userName: '梅怡',
    userType: 'struggling',
    actualPattern: 'B',
    aiQueryCount: 19,
    verificationRate: 0.39,
    independenceRate: 0.41,
    taskCount: 6,
    contextAware: false
  }
];

/**
 * Hybrid users in the extended dataset
 * Hybrid users include: eff_012, eff_014, str_012, str_015, str_019, str_029 (6 out of 30)
 * Total hybrid in N=50: 5 (original) + 6 (new) = 11 (22%)
 */
export const EXTENDED_HYBRID_USERS = {
  'eff_012': 'A',
  'eff_014': 'B',
  'str_012': 'F',
  'str_015': 'E',
  'str_019': 'C',
  'str_029': 'B'
};

/**
 * Get all users (original 20 + extended 30)
 */
export function getAllExtendedUsers(): MockUserProfile[] {
  const { ALL_MOCK_USERS } = require('./mock-member-check-data');
  return [...ALL_MOCK_USERS, ...ADDITIONAL_MOCK_USERS];
}

/**
 * Get statistics about the extended user set
 */
export function getExtendedUserStatistics() {
  const allUsers = getAllExtendedUsers();

  const stats = {
    totalUsers: allUsers.length,
    efficientCount: allUsers.filter((u: MockUserProfile) => u.userType === 'efficient').length,
    strugglingCount: allUsers.filter((u: MockUserProfile) => u.userType === 'struggling').length,
    hybridCount: allUsers.filter((u: MockUserProfile) => u.secondaryPattern).length,
    patternDistribution: {} as Record<string, number>,
    hybridPercentage: 0
  };

  // Count pattern distribution
  allUsers.forEach((user: MockUserProfile) => {
    stats.patternDistribution[user.actualPattern] =
      (stats.patternDistribution[user.actualPattern] || 0) + 1;
  });

  stats.hybridPercentage = (stats.hybridCount / stats.totalUsers) * 100;

  return stats;
}

export default ADDITIONAL_MOCK_USERS;
