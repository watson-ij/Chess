/**
 * Centralized logging utility for the Chess application
 * Provides consistent logging with different severity levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;

  /**
   * Set the minimum log level to display
   * @param level - Minimum log level
   */
  static setLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  /**
   * Get the current log level
   */
  static getLevel(): LogLevel {
    return Logger.currentLevel;
  }

  /**
   * Log a debug message (for development/troubleshooting)
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  static debug(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${Logger.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log an informational message
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  static info(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${Logger.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  static warn(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${Logger.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param args - Additional arguments (e.g., Error objects)
   */
  static error(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${Logger.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Format a log message with timestamp
   * @param message - The message to format
   * @returns Formatted message with timestamp
   */
  private static formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }

  /**
   * Create a logger for a specific module/component
   * @param moduleName - Name of the module
   * @returns Object with scoped logging methods
   */
  static createModuleLogger(moduleName: string) {
    return {
      debug: (message: string, ...args: unknown[]) =>
        Logger.debug(`${moduleName}: ${message}`, ...args),
      info: (message: string, ...args: unknown[]) =>
        Logger.info(`${moduleName}: ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) =>
        Logger.warn(`${moduleName}: ${message}`, ...args),
      error: (message: string, ...args: unknown[]) =>
        Logger.error(`${moduleName}: ${message}`, ...args),
    };
  }
}

// Set default log level based on environment
// In production, you might want to set this to LogLevel.WARN or LogLevel.ERROR
if (import.meta.env.DEV) {
  Logger.setLevel(LogLevel.DEBUG);
} else {
  Logger.setLevel(LogLevel.INFO);
}
