import { proxyError } from "./middlewares/proxy-error";
import type { Express } from "express";
import type { Server } from "node:http";
import { Socket as NetSocket } from "node:net";
import { createProxyMiddleware } from "http-proxy-middleware";

export function attachRealtimeProxy(
    app: Express,
    server: Server,
    target: string,
): void {
    const matches = (path: string) =>
        path === "/socket.io" || path.startsWith("/socket.io/");
    const proxy = createProxyMiddleware({
        target,
        pathFilter: matches,
        changeOrigin: true,
        ws: false,
        on: {
            error: proxyError,
            proxyReq: (proxyReq) => {
                proxyReq.removeHeader("x-user-payload");
            },
            proxyReqWs: (proxyReq) => {
                proxyReq.removeHeader("x-user-payload");
            },
        },
    });
    app.use(proxy);
    server.on("upgrade", (request, socket, head) => {
        const path = (request.url || "").split("?")[0] || "";
        if (matches(path) && socket instanceof NetSocket)
            proxy.upgrade(request, socket, head);
        else socket.destroy();
    });
}
