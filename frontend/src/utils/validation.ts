/**
 * Form Validation Utilities
 *
 * Comprehensive validation functions for common form fields.
 * Provides both validation checks and user-friendly error messages.
 */

/* ============================================
   EMAIL VALIDATION
   ============================================ */

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }

  const atIndex = trimmedEmail.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) {
    return false;
  }

  const localPart = trimmedEmail.substring(0, atIndex);
  const domain = trimmedEmail.substring(atIndex + 1);

  if (localPart.length > 64) {
    return false;
  }

  if (trimmedEmail.includes('..')) {
    return false;
  }

  if (!/^[a-zA-Z0-9]/.test(localPart) || !/[a-zA-Z0-9]$/.test(localPart)) {
    return false;
  }

  if (!/^[a-zA-Z0-9]/.test(domain) || !/[a-zA-Z0-9]$/.test(domain)) {
    return false;
  }

  if (!domain.includes('.')) {
    return false;
  }

  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return false;
  }

  const parts = domain.split('.');
  if (parts.some((part) => part.length === 0 || part.length > 63)) {
    return false;
  }

  const tld = parts[parts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return false;
  }

  const allowedSpecial = /^[a-zA-Z0-9._+-]+$/;
  if (!allowedSpecial.test(localPart)) {
    return false;
  }

  return true;
};

export const getEmailError = (email: string): string => {
  if (!email) {
    return 'Email is required';
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length < 5) {
    return 'Email is too short';
  }

  if (trimmedEmail.length > 254) {
    return 'Email is too long';
  }

  if (!trimmedEmail.includes('@')) {
    return 'Email must contain @ symbol';
  }

  const atIndex = trimmedEmail.lastIndexOf('@');
  if (atIndex === 0 || atIndex === trimmedEmail.length - 1) {
    return 'Invalid email format';
  }

  const domain = trimmedEmail.substring(atIndex + 1);
  if (!domain.includes('.')) {
    return 'Email domain must contain a dot (.)';
  }

  if (trimmedEmail.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }

  if (!validateEmail(email)) {
    return 'Invalid email format';
  }

  return '';
};

/* ============================================
   PASSWORD VALIDATION
   ============================================ */

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
  feedback: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      feedback: ['Password is required'],
    };
  }

  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  } else if (password.length >= 8) {
    score += 20;
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (password.length >= 16) {
    score += 10;
  }

  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add lowercase letters (a-z)');
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add uppercase letters (A-Z)');
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add numbers (0-9)');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add special characters (!@#$%^&* etc)');
  }

  const weakPatterns = [
    /(.)\1{2,}/,
    /^(123|abc|password|qwerty)/i,
  ];

  if (weakPatterns.some((pattern) => pattern.test(password))) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 20);
  }

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 75) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'good';
  } else if (score >= 25) {
    strength = 'fair';
  }

  const isValid = password.length >= 8 && score >= 25;

  return {
    isValid,
    strength,
    score: Math.min(100, score),
    feedback,
  };
};

export const getPasswordError = (password: string): string => {
  const result = validatePassword(password);
  if (result.isValid) {
    return '';
  }
  return result.feedback[0] || 'Password does not meet requirements';
};

/* ============================================
   PASSWORD MATCH VALIDATION
   ============================================ */

export const validatePasswordMatch = (password: string, confirmation: string): boolean => {
  if (!password || !confirmation) {
    return false;
  }
  return password === confirmation;
};

export const getPasswordMatchError = (password: string, confirmation: string): string => {
  if (!confirmation) {
    return 'Please confirm your password';
  }
  if (!validatePasswordMatch(password, confirmation)) {
    return 'Passwords do not match';
  }
  return '';
};

/* ============================================
   USERNAME VALIDATION
   ============================================ */

export const validateUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return false;
  }

  if (/^[-_]|[-_]$/.test(trimmedUsername)) {
    return false;
  }

  return true;
};

export const getUsernameError = (username: string): string => {
  if (!username) {
    return 'Username is required';
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (trimmedUsername.length > 20) {
    return 'Username must be at most 20 characters';
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return 'Username can only contain letters, numbers, underscore, and hyphen';
  }

  if (/^[-_]|[-_]$/.test(trimmedUsername)) {
    return 'Username cannot start or end with hyphen or underscore';
  }

  return '';
};

/* ============================================
   GENERIC VALIDATORS
   ============================================ */

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  if (!value) return false;
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  if (!value) return true;
  return value.length <= maxLength;
};

export const validateNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

export const validateNumberRange = (value: any, min: number, max: number): boolean => {
  if (!validateNumber(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
};

export const validateUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const getPhoneError = (phone: string): string => {
  if (!phone) {
    return 'Phone number is required';
  }
  if (!validatePhone(phone)) {
    return 'Invalid phone number format';
  }
  return '';
};

/* ============================================
   FORM-LEVEL VALIDATION
   ============================================ */

export interface ValidationRules {
  [key: string]: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type?: 'email' | 'password' | 'username' | 'number' | 'url' | 'phone';
    custom?: (value: any) => boolean | string;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateForm = (values: Record<string, any>, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((field) => {
    const value = values[field];
    const rule = rules[field];

    if (rule.required && !validateRequired(value)) {
      errors[field] = `${field} is required`;
      return;
    }

    if (!rule.required && !validateRequired(value)) {
      return;
    }

    if (rule.minLength && !validateMinLength(String(value), rule.minLength)) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
      return;
    }

    if (rule.maxLength && !validateMaxLength(String(value), rule.maxLength)) {
      errors[field] = `${field} must be at most ${rule.maxLength} characters`;
      return;
    }

    if (rule.type) {
      switch (rule.type) {
        case 'email':
          if (!validateEmail(String(value))) {
            errors[field] = 'Invalid email format';
          }
          break;
        case 'password':
          const passwordResult = validatePassword(String(value));
          if (!passwordResult.isValid) {
            errors[field] = passwordResult.feedback[0] || 'Password is too weak';
          }
          break;
        case 'username':
          if (!validateUsername(String(value))) {
            errors[field] = getUsernameError(String(value));
          }
          break;
        case 'number':
          if (!validateNumber(value)) {
            errors[field] = `${field} must be a valid number`;
          }
          break;
        case 'url':
          if (!validateUrl(String(value))) {
            errors[field] = 'Invalid URL format';
          }
          break;
        case 'phone':
          if (!validatePhone(String(value))) {
            errors[field] = 'Invalid phone number';
          }
          break;
      }
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field} is invalid`;
      }
    }
  });

  return errors;
};

export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
