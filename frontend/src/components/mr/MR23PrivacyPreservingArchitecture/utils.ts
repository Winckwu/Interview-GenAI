/**
 * MR23: Privacy-Preserving Architecture - Utilities
 *
 * Enable professional adoption through privacy-first design and encryption.
 * Evidence: 17/49 users (35%) professionals avoid AI due to privacy concerns
 * Market Impact: Unlocks estimated $10B+ enterprise AI market
 *
 * Technical Approaches:
 * 1. On-Premise Inference - model runs locally, zero cloud upload
 * 2. Federated Learning - model updates locally, parameters aggregated
 * 3. Homomorphic Encryption - compute on encrypted data
 * 4. Differential Privacy - add noise to protect individual data
 */

export type PrivacyMode = 'cloud' | 'local' | 'federated' | 'hybrid';
export type EncryptionType = 'none' | 'tls' | 'e2e' | 'homomorphic';
export type ComplianceFramework = 'hipaa' | 'gdpr' | 'soc2' | 'ccpa' | 'none';

export interface PrivacySettings {
  userId: string;
  privacyMode: PrivacyMode;
  dataRetention: number; // days, 0 = immediate deletion
  encryptionEnabled: boolean;
  encryptionType: EncryptionType;
  localStorageOnly: boolean;
  debugLoggingEnabled: boolean;
  consentTimestamp: Date;
  lastUpdated: Date;
}

export interface DataProcessingRecord {
  recordId: string;
  timestamp: Date;
  taskType: string;
  dataSize: number; // bytes
  processingLocation: 'cloud' | 'local';
  encrypted: boolean;
  retentionDays: number;
  complianceChecks: string[];
  deletionScheduled: boolean;
  deletionDate?: Date;
}

export interface EncryptionConfig {
  type: EncryptionType;
  algorithm: string;
  keyLength: number; // bits
  description: string;
  performanceImpact: 'none' | 'low' | 'medium' | 'high';
  privacyLevel: number; // 1-5, 5 = highest
  requirementsUrl: string;
}

export interface ComplianceChecklist {
  framework: ComplianceFramework;
  requirements: Array<{
    id: string;
    requirement: string;
    status: 'met' | 'partial' | 'not-met';
    evidence: string;
    lastVerified: Date;
  }>;
  overallCompliance: number; // 0-100%
  lastAudit: Date;
  certificationExpiry?: Date;
}

export interface PrivacyPolicy {
  version: string;
  lastUpdated: Date;
  dataCategories: string[];
  processingPurposes: string[];
  retentionPolicy: string;
  userRights: string[];
  contactEmail: string;
  documentUrl: string;
}

export interface PrivacyReport {
  reportId: string;
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;
  totalProcessed: number; // data points
  cloudstoredData: number;
  encryptedData: number;
  deletedData: number;
  dataBreaches: number;
  userConsents: number;
  complianceStatus: Record<ComplianceFramework, number>; // 0-100%
  recommendations: string[];
}

// Encryption configurations for different modes
const ENCRYPTION_CONFIGS: Record<EncryptionType, EncryptionConfig> = {
  none: {
    type: 'none',
    algorithm: 'None (Plain Text)',
    keyLength: 0,
    description: 'No encryption - fastest, least private',
    performanceImpact: 'none',
    privacyLevel: 1,
    requirementsUrl: 'https://example.com/docs/no-encryption'
  },
  tls: {
    type: 'tls',
    algorithm: 'TLS 1.3',
    keyLength: 256,
    description: 'Transport layer encryption (in-transit protection)',
    performanceImpact: 'low',
    privacyLevel: 2,
    requirementsUrl: 'https://example.com/docs/tls'
  },
  e2e: {
    type: 'e2e',
    algorithm: 'AES-256-GCM',
    keyLength: 256,
    description: 'End-to-end encryption (data encrypted at rest)',
    performanceImpact: 'low',
    privacyLevel: 4,
    requirementsUrl: 'https://example.com/docs/e2e'
  },
  homomorphic: {
    type: 'homomorphic',
    algorithm: 'Fully Homomorphic Encryption (FHE)',
    keyLength: 2048,
    description: 'Compute on encrypted data - highest privacy, slowest',
    performanceImpact: 'high',
    privacyLevel: 5,
    requirementsUrl: 'https://example.com/docs/fhe'
  }
};

// Compliance framework requirements
const COMPLIANCE_REQUIREMENTS: Record<ComplianceFramework, string[]> = {
  hipaa: [
    'Patient data de-identification required',
    'Audit logging for all access',
    'Encryption at rest and in transit',
    'Business Associate Agreements (BAA)',
    'Data breach notification within 60 days',
    'Access controls and authentication',
    'Data integrity controls'
  ],
  gdpr: [
    'Data processing agreements (DPA)',
    'Privacy by design (data minimization)',
    'User consent for data processing',
    'Right to access and portability',
    'Right to be forgotten',
    'Data breach notification within 72 hours',
    'Privacy impact assessment (DPIA)',
    'Data Protection Officer (DPO) contact'
  ],
  soc2: [
    'Access controls and authentication',
    'Logical isolation of data',
    'Encryption of data at rest',
    'Encryption of data in transit',
    'Monitoring and logging',
    'Incident response procedures',
    'Personnel security',
    'Annual audit and certification'
  ],
  ccpa: [
    'User disclosure of data collection',
    'Right to know what data is collected',
    'Right to delete personal information',
    'Right to opt-out of sale',
    'Non-discrimination for exercising rights',
    'Service provider contracts',
    'Consumer request response (45 days)',
    'Annual privacy notice updates'
  ],
  none: []
};

/**
 * Initialize privacy settings
 */
export function initializePrivacySettings(
  userId: string,
  privacyMode: PrivacyMode = 'cloud'
): PrivacySettings {
  return {
    userId,
    privacyMode,
    dataRetention: privacyMode === 'local' ? 0 : 90, // 90 days for cloud, immediate for local
    encryptionEnabled: privacyMode !== 'cloud',
    encryptionType: privacyMode === 'cloud' ? 'tls' : privacyMode === 'local' ? 'e2e' : 'homomorphic',
    localStorageOnly: privacyMode === 'local',
    debugLoggingEnabled: false,
    consentTimestamp: new Date(),
    lastUpdated: new Date()
  };
}

/**
 * Get encryption configuration
 */
export function getEncryptionConfig(type: EncryptionType): EncryptionConfig {
  return ENCRYPTION_CONFIGS[type];
}

/**
 * Record data processing event
 */
export function recordDataProcessing(
  taskType: string,
  dataSize: number,
  settings: PrivacySettings
): DataProcessingRecord {
  const record: DataProcessingRecord = {
    recordId: `data-${Date.now()}`,
    timestamp: new Date(),
    taskType,
    dataSize,
    processingLocation: settings.localStorageOnly ? 'local' : 'cloud',
    encrypted: settings.encryptionEnabled,
    retentionDays: settings.dataRetention,
    complianceChecks: [],
    deletionScheduled: false
  };

  // Schedule deletion if retention period is set
  if (settings.dataRetention > 0) {
    record.deletionScheduled = true;
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + settings.dataRetention);
    record.deletionDate = deletionDate;
  }

  return record;
}

/**
 * Get compliance checklist for framework
 */
export function getComplianceChecklist(framework: ComplianceFramework): ComplianceChecklist {
  const requirements = COMPLIANCE_REQUIREMENTS[framework] || [];

  const checklist: ComplianceChecklist = {
    framework,
    requirements: requirements.map((req, idx) => ({
      id: `${framework}-${idx}`,
      requirement: req,
      status: 'not-met',
      evidence: '',
      lastVerified: new Date()
    })),
    overallCompliance: 0,
    lastAudit: new Date()
  };

  return checklist;
}

/**
 * Calculate overall compliance percentage
 */
export function calculateCompliancePercentage(checklist: ComplianceChecklist): number {
  if (checklist.requirements.length === 0) return 100;

  const metCount = checklist.requirements.filter(r => r.status === 'met').length;
  const partialCount = checklist.requirements.filter(r => r.status === 'partial').length;

  return Math.round(((metCount + partialCount * 0.5) / checklist.requirements.length) * 100);
}

/**
 * Generate privacy report
 */
export function generatePrivacyReport(
  records: DataProcessingRecord[],
  settings: PrivacySettings,
  frameworks: ComplianceFramework[]
): PrivacyReport {
  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

  const totalProcessed = records.length;
  const cloudStoredData = records.filter(r => r.processingLocation === 'cloud').length;
  const encryptedData = records.filter(r => r.encrypted).length;
  const deletedData = records.filter(r => r.deletionScheduled && r.deletionDate && r.deletionDate < now).length;

  const complianceStatus: Record<ComplianceFramework, number> = {
    hipaa: 0,
    gdpr: 0,
    soc2: 0,
    ccpa: 0,
    none: 100
  };

  // Calculate compliance status for each framework
  frameworks.forEach(framework => {
    const checklist = getComplianceChecklist(framework);
    complianceStatus[framework] = calculateCompliancePercentage(checklist);
  });

  const recommendations: string[] = [];

  if (settings.privacyMode === 'cloud') {
    recommendations.push('Consider enabling end-to-end encryption to protect data at rest');
    recommendations.push('Implement federated learning to reduce data sent to cloud');
  }

  if (cloudStoredData > totalProcessed * 0.8) {
    recommendations.push('Significant amount of data stored in cloud - evaluate local processing options');
  }

  if (encryptedData < totalProcessed * 0.9) {
    recommendations.push('Enable encryption for more data processing tasks');
  }

  if (settings.debugLoggingEnabled) {
    recommendations.push('Disable debug logging in production to reduce data exposure risk');
  }

  return {
    reportId: `report-${Date.now()}`,
    timestamp: now,
    periodStart,
    periodEnd: now,
    totalProcessed,
    cloudstoredData: cloudStoredData,
    encryptedData,
    deletedData,
    dataBreaches: 0,
    userConsents: 1,
    complianceStatus,
    recommendations
  };
}

/**
 * Get privacy comparison matrix
 */
export function getPrivacyModeComparison(): Record<
  PrivacyMode,
  { speed: number; privacy: number; convenience: number; cost: number }
> {
  return {
    cloud: {
      speed: 100,
      privacy: 30,
      convenience: 100,
      cost: 100
    },
    local: {
      speed: 60,
      privacy: 100,
      convenience: 60,
      cost: 150
    },
    federated: {
      speed: 70,
      privacy: 80,
      convenience: 70,
      cost: 120
    },
    hybrid: {
      speed: 85,
      privacy: 85,
      convenience: 85,
      cost: 110
    }
  };
}

/**
 * Get privacy mode recommendation based on use case
 */
export function recommendPrivacyMode(useCase: string): PrivacyMode {
  const sensitiveUseCases = ['medical', 'legal', 'financial', 'confidential'];
  const requiresSpeed = ['real-time', 'high-volume', 'time-sensitive'];

  if (sensitiveUseCases.some(uc => useCase.toLowerCase().includes(uc))) {
    return 'local'; // Maximum privacy for sensitive data
  }

  if (requiresSpeed.some(uc => useCase.toLowerCase().includes(uc))) {
    return 'cloud'; // Maximum speed for performance-critical tasks
  }

  return 'hybrid'; // Balance for general use
}

/**
 * Get privacy policy template
 */
export function getPrivacyPolicyTemplate(): PrivacyPolicy {
  return {
    version: '1.0',
    lastUpdated: new Date(),
    dataCategories: [
      'User input data',
      'Usage analytics',
      'Performance metrics',
      'Error logs',
      'Authentication credentials'
    ],
    processingPurposes: [
      'Provide AI assistance',
      'Improve service quality',
      'Prevent abuse and fraud',
      'Comply with legal requirements',
      'Research and development'
    ],
    retentionPolicy:
      'Data is retained for 90 days after last activity. Users can request immediate deletion. Some data required for legal compliance may be retained longer.',
    userRights: [
      'Right to access your data',
      'Right to correct inaccurate data',
      'Right to delete your data',
      'Right to export your data in portable format',
      'Right to restrict processing',
      'Right to opt-out of non-essential processing',
      'Right to lodge complaints with authorities'
    ],
    contactEmail: 'privacy@example.com',
    documentUrl: 'https://example.com/privacy'
  };
}

/**
 * Validate privacy settings compliance
 */
export function validatePrivacyCompliance(settings: PrivacySettings, framework: ComplianceFramework): {
  compliant: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];

  // Minimum encryption requirement
  if (framework === 'hipaa' || framework === 'gdpr') {
    if (settings.encryptionType === 'none') {
      issues.push(`${framework.toUpperCase()} requires encryption - currently using: none`);
    }
  }

  // Data retention requirements
  if (framework === 'gdpr' && settings.dataRetention > 365) {
    issues.push('GDPR recommends data retention not exceed 365 days');
  }

  if (framework === 'hipaa' && settings.dataRetention > 180) {
    issues.push('HIPAA recommends data retention not exceed 180 days for minimum necessary');
  }

  // Local storage requirement
  if (framework === 'gdpr' && settings.privacyMode !== 'local') {
    issues.push('GDPR compliance stronger with on-premise processing');
  }

  // Debug logging in production
  if (settings.debugLoggingEnabled && ['hipaa', 'gdpr', 'soc2'].includes(framework)) {
    issues.push('Debug logging should be disabled for production environments');
  }

  const score = Math.max(0, 100 - issues.length * 20);

  return {
    compliant: issues.length === 0,
    issues,
    score
  };
}

export default {
  initializePrivacySettings,
  getEncryptionConfig,
  recordDataProcessing,
  getComplianceChecklist,
  calculateCompliancePercentage,
  generatePrivacyReport,
  getPrivacyModeComparison,
  recommendPrivacyMode,
  getPrivacyPolicyTemplate,
  validatePrivacyCompliance
};
