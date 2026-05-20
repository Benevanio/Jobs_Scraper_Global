import { Request, Response } from "express";
import { getIronSession } from "iron-session";
import { ZodError } from "zod";
import { sessionOptions } from "../../lib/session";
import { Session } from "../types/auth.types";
import {
  updatePreferencesSchema,
  updateProfileSchema,
} from "./schemas/user.schemas";
import { UsersService } from "./users.service";

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private async getSession(req: Request, res: Response) {
    return getIronSession<Session>(req, res, sessionOptions);
  }

  // GET /api/users/profile
  async getProfile(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const user = await this.usersService.getUserById(session.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.json(user);
    } catch (error: unknown) {
      return this.handleError(res, error);
    }
  }

  // PATCH /api/users/profile
  async updateProfile(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const body = updateProfileSchema.parse(req.body);
      const updated = await this.usersService.updateProfile(
        session.userId,
        body,
      );

      return res.json(updated);
    } catch (error: unknown) {
      return this.handleError(res, error);
    }
  }

  // GET /api/users/preferences
  async getPreferences(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const prefs = await this.usersService.getPreferences(session.userId);
      if (!prefs) {
        return res.status(404).json({ error: "Preferências não encontradas" });
      }

      return res.json(prefs);
    } catch (error: unknown) {
      return this.handleError(res, error);
    }
  }

  // POST /api/users/preferences
  async createPreferences(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const body = updatePreferencesSchema.partial().parse(req.body);
      const prefs = await this.usersService.createPreferences(
        session.userId,
        body,
      );
      return res.status(201).json(prefs);
    } catch (error: unknown) {
      return this.handleError(res, error);
    }
  }

  // PATCH /api/users/preferences
  async updatePreferences(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const body = updatePreferencesSchema.parse(req.body);
      const updated = await this.usersService.updatePreferences(
        session.userId,
        body,
      );

      return res.json(updated);
    } catch (error: unknown) {
      return this.handleError(res, error);
    }
  }

  // ── Error handler centralizado ─────────────────────────────────────────────

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.flatten().fieldErrors,
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: "Erro desconhecido" });
  }
}
