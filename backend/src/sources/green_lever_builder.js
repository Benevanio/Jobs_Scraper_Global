import { createGreenhouseAdapter } from "../adapters/greenhouse.js";
import { createLeverAdapter } from "../adapters/lever.js";
import { greenhouseCompanies, leverCompanies } from "../interface/index.js";

export function buildAtsSources() {
  const greenhouseSources = greenhouseCompanies.map((token) =>
    createGreenhouseAdapter(token, token),
  );

  const leverSources = leverCompanies.map((slug) =>
    createLeverAdapter(slug, slug),
  );

  return [...greenhouseSources, ...leverSources];
}
