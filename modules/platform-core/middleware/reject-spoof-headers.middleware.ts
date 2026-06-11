import { Request, Response, NextFunction } from 'express';

const SPOOF_HEADERS = ['x-tenant-id', 'x-user-id', 'x-user-role', 'x-org-id'];

/**
 * Rejects identity spoof headers per saas-architecture.md §3.4 / §5 Layer 1.
 * Disabled when ALLOW_DEV_HEADER_AUTH=true (local legacy module testing only).
 */
export function rejectSpoofHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.ALLOW_DEV_HEADER_AUTH === 'true') {
    return next();
  }

  for (const header of SPOOF_HEADERS) {
    if (req.headers[header]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: `Header "${header}" is not allowed. Identity must come from the JWT Bearer token.`,
          details: null,
        },
      });
    }
  }

  next();
}
