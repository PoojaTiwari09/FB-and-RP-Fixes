"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinoHttpOptions = void 0;
exports.pinoHttpOptions = {
    pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.body.password'],
    },
};
//# sourceMappingURL=logger.js.map