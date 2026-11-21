import "dotenv/config";
import express, { Request } from "express";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import {
    optionalAuth,
    requireRegister,
    verifyUser,
} from "./middlewares/auth.middleware";
import morgan from "morgan";
import { attachRealtimeProxy } from "./realtime.proxy";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(
    morgan("dev", {
        skip: (req) => req.path.startsWith("/api/sessions/join/"),
    }),
);

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        skip: (req) => req.path === "/socket.io" || req.path.startsWith("/socket.io/"),
        handler: (_req, res) =>
            res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later.",
            }),
    }),
);

attachRealtimeProxy(app, httpServer, process.env.REALTIME_SERVICE_URL ?? "http://localhost:3004");

app.use(
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
        pathFilter: "/api/auth/**",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 10_000,
        timeout: 10_000,
    }),
);

app.use("/api/user", verifyUser, requireRegister);

app.use(
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
        pathFilter: "/api/user/**",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 10_000,
        timeout: 10_000,
        on: {
            proxyReq: (proxyReq, req: Request, _res) => {
                proxyReq.removeHeader("x-user-payload");

                if (req.user) {
                    proxyReq.setHeader(
                        "x-user-payload",
                        JSON.stringify(req.user),
                    );
                }
            },
        },
    }),
);

app.use(
    optionalAuth,
    createProxyMiddleware({
        target: process.env.SESSION_SERVICE_URL ?? "http://localhost:3002",
        pathFilter: "/api/sessions/join/**",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 10_000,
        timeout: 10_000,
        on: {
            proxyReq: (proxyReq, req: Request) => {
                proxyReq.removeHeader("x-user-payload");
                proxyReq.removeHeader("x-internal-secret");
                if (process.env.INTERNAL_SERVICE_SECRET) {
                    proxyReq.setHeader(
                        "x-internal-secret",
                        process.env.INTERNAL_SERVICE_SECRET,
                    );
                }
                if (req.user) {
                    proxyReq.setHeader(
                        "x-user-payload",
                        JSON.stringify(req.user),
                    );
                }
            },
        },
    }),
);

app.use(
    "/api/sessions",
    verifyUser,
    requireRegister,
    createProxyMiddleware({
        target: process.env.SESSION_SERVICE_URL ?? "http://localhost:3002",
        changeOrigin: true,
        pathRewrite: (path) => `/sessions${path}`,
        proxyTimeout: 10_000,
        timeout: 10_000,
        on: {
            proxyReq: (proxyReq, req: Request, _res) => {
                proxyReq.removeHeader("x-user-payload");
                proxyReq.removeHeader("x-internal-secret");
                if (process.env.INTERNAL_SERVICE_SECRET) {
                    proxyReq.setHeader(
                        "x-internal-secret",
                        process.env.INTERNAL_SERVICE_SECRET,
                    );
                }

                if (req.user) {
                    proxyReq.setHeader(
                        "x-user-payload",
                        JSON.stringify(req.user),
                    );
                }
            },
        },
    }),
);

app.use(
    "/api/organizations",
    verifyUser,
    requireRegister,
    createProxyMiddleware({
        target: process.env.ORG_SERVICE_URL ?? "http://localhost:3003",
        changeOrigin: true,
        pathRewrite: (path) => `/organizations${path}`,
        proxyTimeout: 10_000,
        timeout: 10_000,
        on: {
            proxyReq: (proxyReq, req: Request, _res) => {
                proxyReq.removeHeader("x-user-payload");

                if (req.user) {
                    proxyReq.setHeader(
                        "x-user-payload",
                        JSON.stringify(req.user),
                    );
                }
            },
        },
    }),
);

httpServer.listen(PORT, () => {
    console.log(`Api Gateway running on port ${PORT}`);
});
