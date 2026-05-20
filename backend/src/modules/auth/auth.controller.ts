import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { getIronSession } from "iron-session";
import { z } from "zod";
import {
  AuthCallbackParamsSchema,
  OAuthProviderSchema,
} from "../types/auth.types.js";

import { AuthService } from "./auth.service.js";

interface SessionData {
  oauth_state?: string;
  userId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "vagas_session",

  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async getUrl(req: Request, res: Response) {
    try {
      const session = await getIronSession<SessionData>(
        req,
        res,
        sessionOptions,
      );

      const provider = OAuthProviderSchema.parse(req.params.provider);

      const state = randomBytes(16).toString("hex");

      session.oauth_state = state;

      await session.save();

      const url = await this.authService.getAuthUrl(provider, state);

      return res.json({ url });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Provider inválido",
          details: error.message,
        });
      }

      return res.status(400).json({
        error: (error as Error).message,
      });
    }
  }

  async callback(req: Request, res: Response) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    try {
      const callbackUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

      const params = AuthCallbackParamsSchema.parse({
        provider: req.params.provider,
        code: req.query.code,
        state: req.query.state,
        callbackUrl,
      });

      if (!session.oauth_state) {
        return res.status(400).json({
          error: "OAuth state ausente",
        });
      }

      if (session.oauth_state !== params.state) {
        return res.status(400).json({
          error: "OAuth state inválido",
        });
      }

      delete session.oauth_state;
      await session.save();

      const result = await this.authService.handleCallback({
        ...params,
        callbackUrl,
      });

      return res.json(result);
    } catch (error) {
      console.error("OAuth callback error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Parâmetros de callback inválidos",
          details: error.format(),
        });
      }

      const message = error instanceof Error ? error.message : "Erro interno";

      return res.status(500).json({
        error: message,
      });
    }
  }
}
