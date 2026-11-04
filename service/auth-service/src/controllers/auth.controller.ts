import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { inject, injectable } from "tsyringe";
import AppError from "@/utils/AppError";

const REFRESH_COOKIE_NAME = "pairscope_refresh";

@injectable()
export class AuthController {
    constructor(@inject("UserService") private readonly serv: UserService) {}

    private setRefreshToken(res: Response, token: string) {
        res.cookie(REFRESH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }

    public async signup(req: Request, res: Response) {
        const response = await this.serv.signup(req.body);
        this.setRefreshToken(res, response.refreshToken);

        res.status(201).json({
            user: response.user,
            accessToken: response.accessToken,
        });
    }

    public async login(req: Request, res: Response) {
        const response = await this.serv.login(req.body);
        this.setRefreshToken(res, response.refreshToken);

        res.status(200).json({
            user: response.user,
            accessToken: response.accessToken,
        });
    }

    public async refresh(req: Request, res: Response) {
        const token = req.cookies[REFRESH_COOKIE_NAME];
        if (!token) {
            throw new AppError(401, "Token not provided");
        }

        const response = await this.serv.refresh(token);
        this.setRefreshToken(res, response.refreshToken);

        res.status(200).json({ accessToken: response.accessToken });
    }

    public async logout(req: Request, res: Response) {
        const token = req.cookies[REFRESH_COOKIE_NAME];
        if(!token) {
            throw new AppError(401, "Token not provided")
        }
        await this.serv.logout(token);
        res.clearCookie(REFRESH_COOKIE_NAME);

        res.status(200).json({ success: true });
    }

    public async me(req: Request, res: Response) {
        const user = await this.serv.me(req.user!.userId);
        res.json({ user });
    }
}
