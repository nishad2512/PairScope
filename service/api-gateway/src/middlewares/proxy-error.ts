import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { Request, Response } from "express";
import errHandler from "./err-handler";

export function proxyError(
    error: Error,
    req: IncomingMessage,
    res: ServerResponse | Socket,
): void {
    if (!(res instanceof ServerResponse) || res.headersSent) {
        res.destroy();
        return;
    }
    errHandler(error, req as Request, res as Response, () => res.destroy());
}
