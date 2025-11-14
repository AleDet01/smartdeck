const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Formato custom per logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Transport per console (development)
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  ),
});

// Transport per file con rotazione giornaliera (production)
const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Mantieni 14 giorni di logs
  level: 'info',
  format: customFormat,
});

// Transport per errori separati
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Errori conservati 30 giorni
  level: 'error',
  format: customFormat,
});

// Crea logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { 
    service: 'smartdeck-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [],
  // Non uscire su errori
  exitOnError: false,
});

// Aggiungi transports in base all'ambiente
if (process.env.NODE_ENV === 'production') {
  logger.add(fileRotateTransport);
  logger.add(errorFileTransport);
  console.log('✓ File logging attivo (logs/application-*.log)');
} else {
  logger.add(consoleTransport);
}

// Stream per Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods
logger.logRequest = (req, statusCode, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    }),
  };
  logger.error('Application Error', errorData);
};

logger.logAuth = (action, userId, success, details = {}) => {
  logger.info('Auth Event', {
    action,
    userId,
    success,
    ...details,
  });
};

logger.logDatabase = (operation, collection, duration, error = null) => {
  if (error) {
    logger.error('Database Error', {
      operation,
      collection,
      error: error.message,
      duration: `${duration}ms`,
    });
  } else {
    logger.debug('Database Operation', {
      operation,
      collection,
      duration: `${duration}ms`,
    });
  }
};

module.exports = logger;
