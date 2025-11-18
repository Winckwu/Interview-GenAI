/**
 * Form Validation Utilities
 *
 * Comprehensive validation functions for common form fields
 * with clear error messages and strength indicators
 */

/**
 * Validate email address
 *
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid@') // false
 */
export const validateEmail = (email: string): boolean => {
  // RFC 5322 simplified version
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) return false;

  const [local, domain] = email.split('@');

  // Email local part cannot start or end with dot
  if (local.startsWith('.') || local.endsWith('.')) return false;

  // Email domain cannot start or end with dot
  if (domain.startsWith('.') || domain.endsWith('.')) return false;

  // Local part cannot have consecutive dots
  if (local.includes('..')) return false;

  // Domain cannot have consecutive dots
  if (domain.includes('..')) return false;

  // Minimum length checks
  if (local.length < 1 || domain.length < 3) return false;

  return true;
};

/**
 * Get error message for invalid email
 *
 * @param email - Email string
 * @returns Error message if invalid, empty string if valid
 */
export const getEmailError = (email: string): string => {
  if (!email) return '邮箱地址不能为空';
  if (!email.includes('@')) return '邮箱地址必须包含 @';
  if (email.startsWith('@') || email.endsWith('@')) return '邮箱地址格式不正确';
  if (!validateEmail(email)) return '请输入有效的邮箱地址';
  return '';
};

/**
 * Validate password strength
 *
 * @param password - Password string to validate
 * @returns Object with validation details and strength indicator
 *
 * @example
 * validatePassword('weak')
 * // {
 * //   isValid: false,
 * //   strength: 'weak',
 * //   feedback: '至少 8 个字符',
 * //   score: 0
 * // }
 *
 * validatePassword('MyP@ssw0rd')
 * // {
 * //   isValid: true,
 * //   strength: 'strong',
 * //   feedback: '很强的密码',
 * //   score: 4
 * // }
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string;
  score: number;
} => {
  if (!password) {
    return {
      isValid: false,
      strength: 'weak',
      feedback: '密码不能为空',
      score: 0,
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      strength: 'weak',
      feedback: '至少 8 个字符',
      score: 0,
    };
  }

  // Check for character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Calculate strength score
  let score = 0;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChar) score++;

  // Additional points for length
  if (password.length >= 12) score++;

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let feedback = '';

  if (score === 1) {
    strength = 'weak';
    feedback = '密码强度弱，建议添加大小写字母、数字和特殊字符';
  } else if (score === 2) {
    strength = 'fair';
    feedback = '密码强度一般，建议添加特殊字符';
  } else if (score === 3) {
    strength = 'good';
    feedback = '密码强度较好';
  } else if (score >= 4) {
    strength = 'strong';
    feedback = '密码强度很好';
  }

  return {
    isValid: true,
    strength,
    feedback,
    score: Math.min(score, 5),
  };
};

/**
 * Validate password confirmation
 *
 * @param password - Original password
 * @param confirmation - Confirmation password
 * @returns Boolean indicating if passwords match
 */
export const validatePasswordMatch = (password: string, confirmation: string): boolean => {
  return password === confirmation && password.length > 0;
};

/**
 * Get error message for password mismatch
 *
 * @param password - Original password
 * @param confirmation - Confirmation password
 * @returns Error message if mismatch, empty string if match
 */
export const getPasswordMatchError = (password: string, confirmation: string): string => {
  if (!confirmation) return '请确认密码';
  if (!validatePasswordMatch(password, confirmation)) return '两次输入的密码不一致';
  return '';
};

/**
 * Validate username
 *
 * @param username - Username string
 * @returns Boolean indicating if username is valid
 *
 * Valid username:
 * - 3-20 characters
 * - Only alphanumeric, underscore, hyphen
 * - Cannot start or end with underscore or hyphen
 */
export const validateUsername = (username: string): boolean => {
  if (!username) return false;
  if (username.length < 3 || username.length > 20) return false;

  // Only allow letters, numbers, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false;

  // Cannot start or end with underscore or hyphen
  if (username.startsWith('_') || username.startsWith('-')) return false;
  if (username.endsWith('_') || username.endsWith('-')) return false;

  return true;
};

/**
 * Get error message for invalid username
 *
 * @param username - Username string
 * @returns Error message if invalid, empty string if valid
 */
export const getUsernameError = (username: string): string => {
  if (!username) return '用户名不能为空';
  if (username.length < 3) return '用户名至少 3 个字符';
  if (username.length > 20) return '用户名最多 20 个字符';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return '用户名只能包含字母、数字、下划线和连字符';
  }
  if (username.startsWith('_') || username.startsWith('-')) {
    return '用户名不能以下划线或连字符开头';
  }
  if (username.endsWith('_') || username.endsWith('-')) {
    return '用户名不能以下划线或连字符结尾';
  }
  return '';
};

/**
 * Validate URL
 *
 * @param url - URL string to validate
 * @returns Boolean indicating if URL is valid
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (international format)
 *
 * @param phone - Phone number string
 * @returns Boolean indicating if phone is valid
 *
 * Accepts formats:
 * - +1-555-123-4567
 * - +86 138 0013 8888
 * - 555-123-4567
 * - (555) 123-4567
 */
export const validatePhone = (phone: string): boolean => {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Must be 7-15 digits (international standard)
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return false;

  return true;
};

/**
 * Validate required field (non-empty)
 *
 * @param value - Value to validate
 * @returns Boolean indicating if field is not empty
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate minimum length
 *
 * @param value - Value to validate
 * @param minLength - Minimum required length
 * @returns Boolean indicating if length requirement is met
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate maximum length
 *
 * @param value - Value to validate
 * @param maxLength - Maximum allowed length
 * @returns Boolean indicating if length requirement is met
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate that value is a number
 *
 * @param value - Value to validate
 * @returns Boolean indicating if value is a valid number
 */
export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

/**
 * Validate that number is within range
 *
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Boolean indicating if value is within range
 */
export const validateNumberRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate entire form
 *
 * @param values - Object with form field values
 * @param rules - Object with validation rules for each field
 * @returns Validation result with errors for each field
 *
 * @example
 * const result = validateForm(
 *   { email: 'user@example.com', password: 'MyP@ssw0rd' },
 *   {
 *     email: [(v) => validateEmail(v) || 'Invalid email'],
 *     password: [(v) => v.length >= 8 || 'Min 8 chars'],
 *   }
 * );
 */
export const validateForm = (
  values: Record<string, any>,
  rules: Record<string, ((value: any) => string | true)[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = values[field];

    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) {
        errors[field] = result;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  getEmailError,
  validatePassword,
  validatePasswordMatch,
  getPasswordMatchError,
  validateUsername,
  getUsernameError,
  validateUrl,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateNumberRange,
  validateForm,
};
