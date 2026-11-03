import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) =>
            res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later.",
            }),
    }),
);

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

app.listen(PORT, () => {
    console.log(`Api Gateway running on port ${PORT}`);
});
