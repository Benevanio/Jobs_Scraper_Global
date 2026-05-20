// import { Request, Response } from "express";
// import { getIronSession } from "iron-session";
// import { z } from "zod";
// import { LoginSchema, RegisterSchema } from "../types/credentials.types";
// import { CredentialsService } from "./credentials.service";

// interface SessionData {
//   userId?: string;
// }

// const sessionOptions = {
//   password: process.env.SESSION_SECRET!,
//   cookieName: "vagas_session",
//   cookieOptions: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     maxAge: 60 * 60 * 24 * 7,
//   },
// };

// export class CredentialsController {
//   constructor(private readonly service: CredentialsService) {}

//   async register(req: Request, res: Response) {
//     try {
//       const input = RegisterSchema.parse(req.body);
//       const { user, session: userSession } = await this.service.register(input);

//       const session = await getIronSession<SessionData>(
//         req,
//         res,
//         sessionOptions,
//       );
//       session.userId = user.id;
//       await session.save();

//       return res.status(201).json({ user, session: userSession });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({ error: error.format() });
//       }
//       const message = error instanceof Error ? error.message : "Erro interno";
//       const status = message === "Email já cadastrado" ? 409 : 500;
//       return res.status(status).json({ error: message });
//     }
//   }

//   async login(req: Request, res: Response) {
//     try {
//       const input = LoginSchema.parse(req.body);
//       const { user, session: userSession } = await this.service.login(input);

//       const session = await getIronSession<SessionData>(
//         req,
//         res,
//         sessionOptions,
//       );
//       session.userId = user.id;
//       await session.save();

//       return res.json({ user, session: userSession });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({ error: error.format() });
//       }
//       const message = error instanceof Error ? error.message : "Erro interno";
//       const status = message === "Credenciais inválidas" ? 401 : 500;
//       return res.status(status).json({ error: message });
//     }
//   }

//   async logout(req: Request, res: Response) {
//     const session = await getIronSession<SessionData>(req, res, sessionOptions);
//     session.destroy();
//     return res.json({ ok: true });
//   }

//   async me(req: Request, res: Response) {
//     const session = await getIronSession<SessionData>(req, res, sessionOptions);

//     if (!session.userId) {
//       return res.status(401).json({ error: "Não autenticado" });
//     }

//     return res.json({ userId: session.userId });
//   }
// }

import { Request, Response } from "express";
import { z } from "zod";
import { LoginSchema, RegisterSchema } from "../types/credentials.types";
import { CredentialsService } from "./credentials.service";

export class CredentialsController {
  constructor(private readonly service: CredentialsService) {}

  async register(req: Request, res: Response) {
    try {
      const input = RegisterSchema.parse(req.body);
      const { user, session: userSession } = await this.service.register(input);

      req.session.userId = user.id;
      await req.session.save();

      return res.status(201).json({ user, session: userSession });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.format() });
      }
      const message = error instanceof Error ? error.message : "Erro interno";
      const status = message === "Email já cadastrado" ? 409 : 500;
      return res.status(status).json({ error: message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const input = LoginSchema.parse(req.body);
      const { user, session: userSession } = await this.service.login(input);

      req.session.userId = user.id;
      await req.session.save();

      return res.json({ user, session: userSession });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.format() });
      }
      const message = error instanceof Error ? error.message : "Erro interno";
      const status = message === "Credenciais inválidas" ? 401 : 500;
      return res.status(status).json({ error: message });
    }
  }

  async logout(req: Request, res: Response) {
    await req.session.destroy();
    return res.json({ ok: true });
  }

  async me(req: Request, res: Response) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    return res.json({ userId: req.session.userId });
  }
}
