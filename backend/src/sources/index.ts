import { createAdzunaAdapter } from "../adapters/adzuna.js";
import { empregaCampinasAdapter } from "../adapters/empregaCampinas.js";
import { glassdoorAdapter } from "../adapters/glassdoor.js";
import { indeedAdapter } from "../adapters/indeed.js";
import { linkedinAdapter } from "../adapters/linkedin.js";
import { theMuseAdapter } from "../adapters/theMuse.js";
import { buildAtsSources } from "./green_lever_builder.js";

export const sources = [
  linkedinAdapter,

  createAdzunaAdapter({
    appId: process.env.ADZUNA_APP_ID || "",
    appKey: process.env.ADZUNA_APP_KEY || "",
    country: process.env.ADZUNA_COUNTRY || "br",
  }),

  theMuseAdapter,

  empregaCampinasAdapter,
  glassdoorAdapter,
  indeedAdapter,

  ...buildAtsSources(),
].filter(Boolean);
