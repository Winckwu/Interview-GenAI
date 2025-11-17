/**
 * E2E Test Utilities and Mock APIs
 * Support for user journey simulation and pattern detection
 */

export interface UserProfile {
  userId: string;
  patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  taskCount: number;
  aiQueryCount: number;
  verificationRate: number;
  independenceRate: number;
  trustScore: number;
}

export interface TaskContext {
  description: string;
  importance: 'high' | 'medium' | 'low';
  riskLevel: string;
  taskType?: string;
  academicWeight?: string;
}

export interface PatternDetectionResult {
  pattern: string;
  confidence: number;
  evidence: string[];
  riskLevel: string;
  recommendedActions: string[];
}

export interface BehaviorLog {
  timestamp: Date;
  action: string;
  taskId: string;
  details: Record<string, any>;
}

/**
 * Mock API Service for E2E Testing
 */
export class MockAPIService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private behaviorLogs: BehaviorLog[] = [];
  private taskHistory: Map<string, TaskContext> = new Map();

  /**
   * Create user and initialize profile
   */
  async createUser(userId: string, patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      patternType,
      taskCount: 0,
      aiQueryCount: 0,
      verificationRate: 0,
      independenceRate: 1.0,
      trustScore: 0.5
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Log user behavior
   */
  async logBehavior(
    userId: string,
    taskId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    this.behaviorLogs.push({
      timestamp: new Date(),
      action,
      taskId,
      details
    });

    const profile = this.userProfiles.get(userId);
    if (profile) {
      if (action === 'ai_query') {
        profile.aiQueryCount++;
      }
      if (action === 'task_started') {
        profile.taskCount++;
      }
      if (action === 'verify_output' && profile.taskCount > 0) {
        // Update verification rate as running average (cap at 1.0)
        const currentVerifications = Math.round(profile.verificationRate * profile.taskCount);
        profile.verificationRate = Math.min(1.0, (currentVerifications + 1) / profile.taskCount);
      }
    }
  }

  /**
   * Start task and track context
   */
  async startTask(userId: string, taskId: string, context: TaskContext): Promise<void> {
    this.taskHistory.set(taskId, context);

    // Log task_started to increment task count
    await this.logBehavior(userId, taskId, 'task_started', { context });
  }

  /**
   * Query AI
   */
  async queryAI(userId: string, taskId: string, query: string): Promise<string> {
    await this.logBehavior(userId, taskId, 'ai_query', { query });

    // Simulate AI response based on query
    if (query.includes('summarize') || query.includes('summarise')) {
      return 'Here is a comprehensive summary of the key points...';
    }
    if (query.includes('compress') || query.includes('condense')) {
      return 'Here is a condensed version that maintains the core meaning...';
    }
    if (query.includes('outline')) {
      return '1. Main point 1\n2. Main point 2\n3. Main point 3\n...';
    }
    return 'AI generated content based on your query';
  }

  /**
   * Log verification/review action
   */
  async verifyOutput(userId: string, taskId: string, method: string): Promise<void> {
    await this.logBehavior(userId, taskId, 'verify_output', { method });
  }

  /**
   * Accept AI output
   */
  async acceptOutput(userId: string, taskId: string, withReview: boolean = true): Promise<void> {
    await this.logBehavior(userId, taskId, 'accept_output', { withReview });
    // If accepting with review, also log it as verification
    if (withReview) {
      await this.logBehavior(userId, taskId, 'verify_output', { method: 'accept_with_review' });
    }
  }

  /**
   * Detect user pattern based on behaviors
   */
  async detectPattern(userId: string): Promise<PatternDetectionResult> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User ${userId} not found`);
    }

    // Calculate pattern characteristics
    const aiQueryRatio = profile.aiQueryCount / Math.max(profile.taskCount, 1);
    const verificationRatio = profile.verificationRate;
    const independenceRatio = profile.independenceRate;

    // Pattern detection logic - Conservative approach: preserve initialized pattern unless strong override
    let detectedPattern = profile.patternType;
    let confidence = 0.60;
    const evidence: string[] = [];

    // Step 1: Check for STRONG overrides only (Pattern F escalation, Recovery)

    // Pattern F escalation: Only override if VERY strong signals (3+ tasks of over-reliance)
    if (aiQueryRatio > 0.8 && verificationRatio < 0.3 && profile.taskCount >= 3) {
      detectedPattern = 'F';
      confidence = 0.95;
      evidence.push('High AI dependency', 'Low verification rate', 'Rapid acceptance of outputs');
    }
    // Recovery from F: Switch to C after improvement
    else if (profile.patternType === 'F' && aiQueryRatio <= 0.8 && verificationRatio > 0.15) {
      detectedPattern = 'C';
      confidence = 0.75;
      evidence.push('Showing recovery behavior', 'Reduced AI dependency', 'Increased verification');
    }
    // Step 2: Check for iterative refinement override (Pattern B)
    // Only override to B if behavior is clearly multi-query with verification AND not A/C/D/E
    else if (aiQueryRatio > 1.5 && verificationRatio > 0.6 &&
             !['A', 'C', 'D', 'E'].includes(profile.patternType)) {
      detectedPattern = 'B';
      confidence = 0.85;
      evidence.push('Moderate AI use', 'Iterative refinement', 'Balanced approach');
    }
    // Step 3: Preserve initialized patterns with confidence based on behavior
    else if (profile.patternType === 'A') {
      detectedPattern = 'A';
      confidence = verificationRatio > 0.6 ? 0.85 : 0.70;
      evidence.push('High verification rate', 'Strong independent work', 'Rigorous quality control');
    }
    else if (profile.patternType === 'B') {
      detectedPattern = 'B';
      confidence = aiQueryRatio > 1.5 && verificationRatio > 0.5 ? 0.85 : 0.70;
      evidence.push('Moderate AI use', 'Iterative refinement', 'Balanced approach');
    }
    else if (profile.patternType === 'C') {
      detectedPattern = 'C';
      confidence = verificationRatio > 0.3 ? 0.80 : 0.65;
      evidence.push('Context-aware decisions', 'Adaptive strategies', 'Situation-dependent AI use');
    }
    else if (profile.patternType === 'D') {
      detectedPattern = 'D';
      confidence = verificationRatio > 0.7 ? 0.85 : 0.70;
      evidence.push('Deep verification learning');
    }
    else if (profile.patternType === 'E') {
      detectedPattern = 'E';
      confidence = 0.70;
      evidence.push('Knowledge sharing and teaching focus');
    }
    // Fallback for Pattern F
    else if (profile.patternType === 'F') {
      detectedPattern = 'F';
      // Allow recovery detection if behavior improves
      if (aiQueryRatio <= 0.8 && verificationRatio > 0.15) {
        detectedPattern = 'C';
        confidence = 0.75;
        evidence.push('Showing recovery behavior', 'Reduced AI dependency', 'Increased verification');
      } else {
        confidence = aiQueryRatio > 0.8 ? 0.85 : 0.70;
        evidence.push('High AI dependency', 'Low verification rate', 'Rapid acceptance of outputs');
      }
    }
    // Ultimate fallback
    else {
      detectedPattern = profile.patternType;
      confidence = 0.60;
      evidence.push('User pattern: ' + profile.patternType);
    }

    const riskLevel = detectedPattern === 'F' ? 'high' : detectedPattern === 'A' ? 'low' : 'medium';

    return {
      pattern: detectedPattern,
      confidence,
      evidence,
      riskLevel,
      recommendedActions: this.getRecommendedActions(detectedPattern)
    };
  }

  /**
   * Get recommended actions based on pattern
   */
  private getRecommendedActions(pattern: string): string[] {
    const recommendations: Record<string, string[]> = {
      A: ['Continue rigorous verification', 'Task decomposition support', 'Advanced tools for comparison'],
      B: ['Balance independence and efficiency', 'Iterative refinement support', 'Learning resources'],
      C: ['Contextual guidance', 'Adaptive recommendations', 'Task importance detection'],
      D: ['Encourage verification', 'Learning mechanisms', 'Deep understanding focus'],
      E: ['Teaching support tools', 'Knowledge sharing encouragement', 'Collaborative features'],
      F: ['Over-reliance warning', 'Intervention required', 'AI usage restrictions', 'Skills development plan']
    };

    return recommendations[pattern] || [];
  }

  /**
   * Get behavior statistics for user
   */
  async getBehaviorStats(userId: string): Promise<Record<string, number>> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return {};

    return {
      totalTasks: profile.taskCount,
      aiQueries: profile.aiQueryCount,
      verificationRate: profile.verificationRate,
      independenceRate: profile.independenceRate,
      averageQuerysPerTask: profile.aiQueryCount / Math.max(profile.taskCount, 1)
    };
  }

  /**
   * Check if Pattern F intervention should trigger
   */
  async shouldTriggerIntervention(userId: string): Promise<boolean> {
    const pattern = await this.detectPattern(userId);
    return pattern.pattern === 'F' && pattern.confidence > 0.80;
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData(): void {
    this.userProfiles.clear();
    this.behaviorLogs = [];
    this.taskHistory.clear();
  }
}

/**
 * Test Page Helper
 */
export class MockPage {
  private elements: Map<string, boolean> = new Map();
  private suggestions: string[] = [];
  private messages: Map<string, string> = new Map();

  hasElement(elementName: string): boolean {
    return this.elements.get(elementName) || false;
  }

  setElement(elementName: string, exists: boolean): void {
    this.elements.set(elementName, exists);
  }

  getElement(elementName: string): string {
    return this.messages.get(elementName) || '';
  }

  setMessage(elementName: string, message: string): void {
    this.messages.set(elementName, message);
  }

  addSuggestion(suggestion: string): void {
    this.suggestions.push(suggestion);
  }

  getSuggestions(): string[] {
    return this.suggestions;
  }

  getTaskRisk(): string {
    return this.messages.get('task_risk') || 'unknown';
  }

  setTaskRisk(risk: string): void {
    this.messages.set('task_risk', risk);
  }

  getTaskCategory(): string {
    return this.messages.get('task_category') || 'unknown';
  }

  setTaskCategory(category: string): void {
    this.messages.set('task_category', category);
  }

  clear(): void {
    this.elements.clear();
    this.messages.clear();
    this.suggestions = [];
  }
}

/**
 * User Journey Simulator
 */
export class UserJourneySimulator {
  private api: MockAPIService;
  private page: MockPage;
  private currentUserId: string = '';
  private currentTaskId: string = '';

  constructor() {
    this.api = new MockAPIService();
    this.page = new MockPage();
  }

  /**
   * Initialize user for journey
   */
  async initializeUser(userId: string, patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): Promise<UserProfile> {
    this.currentUserId = userId;
    return this.api.createUser(userId, patternType);
  }

  /**
   * Start a task
   */
  async startTask(context: TaskContext): Promise<string> {
    this.currentTaskId = `task_${Date.now()}`;
    await this.api.startTask(this.currentUserId, this.currentTaskId, context);

    // Update page based on task context
    if (context.importance === 'high') {
      this.page.setTaskRisk('high');
      this.page.setElement('TaskImportanceIndicator', true);
      // For high-importance academic tasks, show decomposition tools
      this.page.setElement('TaskDecompositionTool', true);
      this.page.setElement('SelfStudyScaffold', true);
      this.page.setElement('WordByWordComparisonTool', true);
      this.page.setElement('VerificationToolbar', true);
      this.page.setElement('HumanReviewRequired', true);
    } else {
      this.page.setTaskRisk('low');
      // For low-importance tasks, show AI assistance tools but still require review
      this.page.setElement('AIOutlineGenerator', true);
      this.page.setElement('HumanReviewRequired', true); // Always require human review for safety
      this.page.setElement('AIQuickGenerate', true);
    }

    if (context.taskType === 'functional_communication') {
      this.page.setTaskCategory('functional');
      // For functional tasks, enable direct AI use
      this.page.setElement('DirectAIButton', true);
    }

    return this.currentTaskId;
  }

  /**
   * Query AI
   */
  async queryAI(query: string): Promise<string> {
    return this.api.queryAI(this.currentUserId, this.currentTaskId, query);
  }

  /**
   * Verify output
   */
  async verifyOutput(method: string): Promise<void> {
    await this.api.verifyOutput(this.currentUserId, this.currentTaskId, method);
  }

  /**
   * Accept output
   */
  async acceptOutput(withReview: boolean = true): Promise<void> {
    await this.api.acceptOutput(this.currentUserId, this.currentTaskId, withReview);
  }

  /**
   * Get pattern detection and update page state
   */
  async getPatternDetection(): Promise<PatternDetectionResult> {
    const detection = await this.api.detectPattern(this.currentUserId);

    // Update page elements based on pattern detection
    if (detection.pattern === 'F' && detection.confidence > 0.80) {
      this.page.setElement('OverRelianceWarning', true);
      this.page.setMessage('WarningMessage', 'You are relying too heavily on AI. Please verify your work more carefully.');
    }

    return detection;
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    return this.api.getUserProfile(this.currentUserId);
  }

  /**
   * Check if intervention should trigger and update page state
   */
  async checkIntervention(): Promise<boolean> {
    const shouldIntervene = await this.api.shouldTriggerIntervention(this.currentUserId);

    // Update page if intervention is needed
    if (shouldIntervene) {
      const detection = await this.api.detectPattern(this.currentUserId);
      this.page.setElement('OverRelianceWarning', true);
      this.page.setMessage('WarningMessage', 'You are relying too heavily on AI. Please verify your work more carefully.');
    }

    return shouldIntervene;
  }

  /**
   * Get behavior statistics
   */
  async getBehaviorStats(): Promise<Record<string, number>> {
    return this.api.getBehaviorStats(this.currentUserId);
  }

  /**
   * Get page helper
   */
  getPage(): MockPage {
    return this.page;
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.api.clearAllData();
    this.page.clear();
    this.currentUserId = '';
    this.currentTaskId = '';
  }
}

/**
 * Create shared test instance
 */
export const createTestEnvironment = (): { simulator: UserJourneySimulator; page: MockPage } => {
  const simulator = new UserJourneySimulator();
  return {
    simulator,
    page: simulator.getPage()
  };
};
