/**
 * Logger utility for development and debugging
 */

const isDevelopment = __DEV__;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[RuralConnect]', ...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error('[RuralConnect Error]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn('[RuralConnect Warning]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info('[RuralConnect Info]', ...args);
    }
  },
};
