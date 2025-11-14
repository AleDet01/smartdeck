const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = (app) => {
  // Solo in produzione
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Sentry disabilitato in development');
    return;
  }

  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️ SENTRY_DSN non configurato - error tracking disabilitato');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1, // 10% delle transazioni (ottimizza costi)
    profilesSampleRate: 0.1,
    integrations: [
      // HTTP request tracking
      new Sentry.Integrations.Http({ tracing: true }),
      // Express integration
      new Sentry.Integrations.Express({ app }),
      // Performance profiling
      new ProfilingIntegration(),
    ],
    beforeSend(event, hint) {
      // Filtra errori comuni non critici
      const error = hint.originalException;
      
      // Ignora errori di connessione client
      if (error && error.message) {
        if (error.message.includes('ECONNRESET')) return null;
        if (error.message.includes('ECONNABORTED')) return null;
        if (error.message.includes('socket hang up')) return null;
      }
      
      // Ignora 404 (troppi falsi positivi)
      if (event.request && event.request.url) {
        const statusCode = event.contexts?.response?.status_code;
        if (statusCode === 404) return null;
      }
      
      return event;
    },
  });

  console.log('✓ Sentry error tracking attivo');
  
  // Request handler deve essere il primo middleware
  app.use(Sentry.Handlers.requestHandler());
  // Tracing handler per performance monitoring
  app.use(Sentry.Handlers.tracingHandler());
};

// Error handler deve essere DOPO tutte le routes
const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Cattura solo errori 5xx
      return error.status >= 500;
    },
  });
};

module.exports = { initSentry, sentryErrorHandler };
