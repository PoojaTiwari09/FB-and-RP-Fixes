"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSpoofHeadersMiddleware = rejectSpoofHeadersMiddleware;
const SPOOF_HEADERS = ['x-tenant-id', 'x-user-id', 'x-user-role', 'x-org-id'];
function rejectSpoofHeadersMiddleware(req, res, next) {
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
//# sourceMappingURL=reject-spoof-headers.middleware.js.map