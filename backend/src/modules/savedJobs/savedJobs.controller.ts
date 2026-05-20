import { Request, Response } from "express";
import { getIronSession } from "iron-session";
import { ZodError, z } from "zod";
import { sessionOptions } from "../../lib/session";
import { Session } from "../types/auth.types";
import { SavedJobsService } from "./savedJobs.service";

const createJobSchema = z.object({
  jobLink: z.string().url(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  keyword: z.string().optional(),
  status: z
    .enum(["saved", "applied", "interviewing", "rejected", "accepted"])
    .optional(),
  appliedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const updateJobSchema = createJobSchema.partial();

export class SavedJobsController {
  constructor(private readonly service: SavedJobsService) {}

  private async getSession(req: Request, res: Response) {
    return getIronSession<Session>(req, res, sessionOptions);
  }

  // GET /api/saved-jobs
  async getAll(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId)
        return res.status(401).json({ error: "Não autenticado" });

      const jobs = await this.service.getAll(session.userId);
      return res.json(jobs);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // GET /api/saved-jobs/:id
  async getById(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId)
        return res.status(401).json({ error: "Não autenticado" });

      const job = await this.service.getById(
        session.userId,
        req.params.id as string,
      );
      if (!job) return res.status(404).json({ error: "Vaga não encontrada" });

      return res.json(job);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // POST /api/saved-jobs
  async create(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId)
        return res.status(401).json({ error: "Não autenticado" });

      const body = createJobSchema.parse(req.body);
      const job = await this.service.create(session.userId, body);
      return res.status(201).json(job);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // PATCH /api/saved-jobs/:id
  async update(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId)
        return res.status(401).json({ error: "Não autenticado" });

      const body = updateJobSchema.parse(req.body);
      const job = await this.service.update(
        session.userId,
        req.params.id as string,
        body,
      );
      return res.json(job);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // DELETE /api/saved-jobs/:id
  async delete(req: Request, res: Response) {
    try {
      const session = await this.getSession(req, res);
      if (!session.userId)
        return res.status(401).json({ error: "Não autenticado" });

      await this.service.delete(session.userId, req.params.id as string);
      return res.status(204).send();
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.flatten().fieldErrors,
      });
    }
    if (error instanceof Error) {
      if (error.message === "Vaga já salva.")
        return res.status(409).json({ error: error.message });

      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Erro desconhecido" });
  }
}
