/**
 * SkillMonitoringService
 * Monitor skill degradation over time and trigger interventions
 * Evidence: 21/49 users (43%) worried about skill atrophy
 * Case: User I38 discovered severe skill decline 6 months after job interview
 */

export type SkillCategory = 'coding' | 'writing' | 'analysis' | 'design' | 'math' | 'research' | 'creative' | 'planning';
export type AtrophyLevel = 'healthy' | 'warning' | 'critical' | 'severe';
export type InterventionType = 'none' | 'gentle-reminder' | 'practice-suggestion' | 'ai-restriction';

export interface SkillBaseline {
  skillId: string;
  category: SkillCategory;
  timestamp: Date;
  independenceRate: number; // 0-1
  proficiencyScore: number; // 1-10
}

export interface SkillSession {
  sessionId: string;
  timestamp: Date;
  skillCategory: SkillCategory;
  tasksCompleted: number;
  independentlyCompleted: number;
  qualityRating: number; // 1-5
}

export interface SkillHealthProfile {
  skillId: string;
  category: SkillCategory;
  currentIndependenceRate: number;
  baselineIndependenceRate: number;
  declinePercentage: number;
  monthsSinceBaseline: number;
  sessionCount: number;
  atrophyLevel: AtrophyLevel;
  riskScore: number; // 0-100
  monthsUntilCritical: number;
}

export interface AtrophyWarning {
  warningId: string;
  timestamp: Date;
  skillCategory: SkillCategory;
  atrophyLevel: AtrophyLevel;
  interventionType: InterventionType;
  message: string;
}

// Thresholds for atrophy detection
const ATROPHY_THRESHOLDS = {
  warningDecline: 0.15, // 15% decline
  criticalDecline: 0.30, // 30% decline
  severeDecline: 0.50, // 50% decline
  minMonthsToTrack: 1,
  criticalMonthsUntil: 2
};

export class SkillMonitoringService {
  private baselines: Map<string, SkillBaseline> = new Map();
  private sessions: Map<string, SkillSession[]> = new Map();
  private warnings: Map<string, AtrophyWarning[]> = new Map();

  /**
   * Register skill baseline
   */
  registerBaseline(baseline: SkillBaseline): void {
    if (baseline.independenceRate < 0 || baseline.independenceRate > 1) {
      throw new Error('Independence rate must be between 0 and 1');
    }
    if (baseline.proficiencyScore < 1 || baseline.proficiencyScore > 10) {
      throw new Error('Proficiency score must be between 1 and 10');
    }

    this.baselines.set(baseline.skillId, baseline);
    this.sessions.set(baseline.skillId, []);
    this.warnings.set(baseline.skillId, []);
  }

  /**
   * Record skill session
   */
  recordSession(session: SkillSession): SkillHealthProfile | null {
    // Find baseline for this skill category
    const baseline = Array.from(this.baselines.values()).find(
      b => b.category === session.skillCategory && b.timestamp <= session.timestamp
    );

    if (!baseline) {
      return null; // No baseline registered for this skill
    }

    // Add session
    if (!this.sessions.has(baseline.skillId)) {
      this.sessions.set(baseline.skillId, []);
    }
    this.sessions.get(baseline.skillId)!.push(session);

    // Calculate health profile
    return this.calculateHealthProfile(baseline);
  }

  /**
   * Calculate skill health profile
   */
  private calculateHealthProfile(baseline: SkillBaseline): SkillHealthProfile {
    const sessions = this.sessions.get(baseline.skillId) || [];
    const now = new Date();

    // Calculate current independence rate
    const totalTasks = sessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const independentTasks = sessions.reduce((sum, s) => sum + s.independentlyCompleted, 0);
    const currentIndependenceRate = totalTasks > 0 ? independentTasks / totalTasks : 0;

    // Calculate months since baseline
    const monthsElapsed = Math.max(
      1,
      (now.getTime() - baseline.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Calculate decline
    const decline = baseline.independenceRate - currentIndependenceRate;
    const declinePercentage = (decline / baseline.independenceRate) * 100;

    // Determine atrophy level
    let atrophyLevel: AtrophyLevel = 'healthy';
    if (declinePercentage >= ATROPHY_THRESHOLDS.severeDecline * 100) {
      atrophyLevel = 'severe';
    } else if (declinePercentage >= ATROPHY_THRESHOLDS.criticalDecline * 100) {
      atrophyLevel = 'critical';
    } else if (declinePercentage >= ATROPHY_THRESHOLDS.warningDecline * 100) {
      atrophyLevel = 'warning';
    }

    // Calculate risk score
    const riskScore = Math.min(100, declinePercentage);

    // Estimate months until critical
    let monthsUntilCritical = 999;
    if (monthsElapsed > 0 && declinePercentage < ATROPHY_THRESHOLDS.criticalDecline * 100) {
      const declineRate = declinePercentage / monthsElapsed;
      if (declineRate > 0) {
        const remainingDecline =
          ATROPHY_THRESHOLDS.criticalDecline * 100 - declinePercentage;
        monthsUntilCritical = Math.ceil(remainingDecline / declineRate);
      }
    }

    // Check if warning should be triggered
    if (atrophyLevel !== 'healthy') {
      this.triggerWarning(baseline.skillId, baseline.category, atrophyLevel);
    }

    return {
      skillId: baseline.skillId,
      category: baseline.category,
      currentIndependenceRate,
      baselineIndependenceRate: baseline.independenceRate,
      declinePercentage,
      monthsSinceBaseline: monthsElapsed,
      sessionCount: sessions.length,
      atrophyLevel,
      riskScore,
      monthsUntilCritical
    };
  }

  /**
   * Get skill health profile
   */
  getHealthProfile(skillId: string): SkillHealthProfile | null {
    const baseline = this.baselines.get(skillId);
    if (!baseline) return null;

    return this.calculateHealthProfile(baseline);
  }

  /**
   * Detect atrophy and trigger warning
   */
  private triggerWarning(
    skillId: string,
    category: SkillCategory,
    atrophyLevel: AtrophyLevel
  ): AtrophyWarning {
    const profile = this.getHealthProfile(skillId);
    if (!profile) {
      throw new Error('Skill profile not found');
    }

    let interventionType: InterventionType = 'none';
    let message = '';

    switch (atrophyLevel) {
      case 'severe':
        interventionType = 'ai-restriction';
        message = `🚨 CRITICAL: ${category} independence dropped to ${Math.round(
          profile.currentIndependenceRate * 100
        )}%. AI disabled until practice completed.`;
        break;

      case 'critical':
        interventionType = 'practice-suggestion';
        message = `⚠️ CRITICAL: ${category} skills declining (${Math.round(
          profile.declinePercentage
        )}% drop). Start 2-week practice plan.`;
        break;

      case 'warning':
        interventionType = 'gentle-reminder';
        message = `⚠️ Notice: ${category} independence declining. Consider 1-2 independent tasks this week.`;
        break;

      case 'healthy':
        interventionType = 'none';
        message = `✓ ${category} skills stable. Keep up regular practice.`;
        break;
    }

    const warning: AtrophyWarning = {
      warningId: `warn-${Date.now()}`,
      timestamp: new Date(),
      skillCategory: category,
      atrophyLevel,
      interventionType,
      message
    };

    if (!this.warnings.has(skillId)) {
      this.warnings.set(skillId, []);
    }
    this.warnings.get(skillId)!.push(warning);

    return warning;
  }

  /**
   * Check if intervention should be triggered
   */
  shouldTriggerIntervention(profile: SkillHealthProfile): boolean {
    return profile.atrophyLevel !== 'healthy';
  }

  /**
   * Get intervention type based on atrophy level
   */
  getInterventionType(atrophyLevel: AtrophyLevel): InterventionType {
    switch (atrophyLevel) {
      case 'severe':
        return 'ai-restriction';
      case 'critical':
        return 'practice-suggestion';
      case 'warning':
        return 'gentle-reminder';
      case 'healthy':
        return 'none';
    }
  }

  /**
   * Get warnings for a skill
   */
  getWarnings(skillId: string): AtrophyWarning[] {
    return this.warnings.get(skillId) || [];
  }

  /**
   * Get all warnings
   */
  getAllWarnings(): AtrophyWarning[] {
    return Array.from(this.warnings.values()).flat();
  }

  /**
   * Calculate sensitivity of atrophy detection
   * How quickly does it detect degradation?
   */
  getDetectionSensitivity(baseline: SkillBaseline, sessions: SkillSession[]): number {
    if (sessions.length === 0) return 0;

    // Sensitivity = (Decline detected at session N) / (Total decline possible)
    // Sessions needed to detect warning (15% decline)
    const warningThreshold = baseline.independenceRate * ATROPHY_THRESHOLDS.warningDecline;
    let sessionsNeeded = 0;

    for (let i = 0; i < sessions.length; i++) {
      const sessionSum = sessions.slice(0, i + 1);
      const totalT = sessionSum.reduce((s, se) => s + se.tasksCompleted, 0);
      const indepT = sessionSum.reduce((s, se) => s + se.independentlyCompleted, 0);
      const rate = totalT > 0 ? indepT / totalT : 0;
      const declineS = baseline.independenceRate - rate;

      if (declineS >= warningThreshold) {
        sessionsNeeded = i + 1;
        break;
      }
    }

    // Sensitivity = how early detection happens (1.0 = detected at first sign)
    if (sessionsNeeded === 0) return 0;
    return Math.min(1, 1 / sessionsNeeded);
  }

  /**
   * Clear data (for testing)
   */
  clearData(): void {
    this.baselines.clear();
    this.sessions.clear();
    this.warnings.clear();
  }
}

export default SkillMonitoringService;
