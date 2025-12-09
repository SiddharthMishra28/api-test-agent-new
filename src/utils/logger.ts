enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (this.getLogLevelOrder(level) >= this.getLogLevelOrder(this.logLevel)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
      };
      console.log(JSON.stringify(logEntry));
    }
  }

  private getLogLevelOrder(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return 0;
      case LogLevel.INFO:
        return 1;
      case LogLevel.WARN:
        return 2;
      case LogLevel.ERROR:
        return 3;
      default:
        return 1;
    }
  }

  public debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  public info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  public warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  public error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger();
