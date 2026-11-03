import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { inject } from "tsyringe";
import AppError from "@/utils/AppError";

export class AuthController {
    constructor(@inject("UserService") private readonly serv: UserService) {}

    private setRefreshToken(res: Response, token: string) {
        res.cookie("pairscope_refresh", token, {
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
        const token = req.cookies.pairscope_refresh;
        if (!token) {
            throw new AppError(401, "Token not provided");
        }

        const response = await this.serv.refresh(token);
        this.setRefreshToken(res, response.refreshToken);

        res.status(200).json({ accessToken: response.accessToken });
    }

    public async logout(req: Request, res: Response) {
        const token = req.cookies.pairscope_refresh;
        if(!token) {
            throw new AppError(401, "Token not provided")
        }
        await this.serv.logout(token);
        res.clearCookie('refreshToken');

        res.status(200).json({ success: true });
    }

    public async me(req: Request, res: Response) {
        const user = await this.serv.me(req.user!.userId);
        res.json({ user });
    }
}
