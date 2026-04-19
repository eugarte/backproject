import { Request, Response, NextFunction } from 'express';
import { register } from 'prom-client';

// Collect default metrics
register.setDefaultLabels({
  app: 'msseguridad',
});

// Create custom metrics
import { Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Authentication metrics
const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'result'],
});

// Token metrics
const tokenOperations = new Counter({
  name: 'token_operations_total',
  help: 'Token operations (issue, refresh, revoke)',
  labelNames: ['operation'],
});

// Security metrics
const securityEvents = new Counter({
  name: 'security_events_total',
  help: 'Security events (failed login, rate limit, etc.)',
  labelNames: ['event_type', 'severity'],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    });
  });

  next();
}

// Export metrics for external use
export function recordAuthAttempt(type: string, result: 'success' | 'failure'): void {
  authAttempts.inc({ type, result });
}

export function recordTokenOperation(operation: 'issue' | 'refresh' | 'revoke'): void {
  tokenOperations.inc({ operation });
}

export function recordSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
  securityEvents.inc({ event_type: eventType, severity });
}

export { register };
