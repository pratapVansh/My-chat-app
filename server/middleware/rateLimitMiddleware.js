import rateLimit from 'express-rate-limit'

// General API rate limiter - applies to all API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Strict limiter for authentication routes (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
})

// Password reset limiter - more restrictive
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Message sending limiter - prevent spam
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: {
    success: false,
    message: 'You are sending messages too quickly. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Group creation limiter
export const groupCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 groups per hour
  message: {
    success: false,
    message: 'Too many groups created, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Avatar/file upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Search limiter - prevent search abuse
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
