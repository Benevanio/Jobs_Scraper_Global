import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CANDIDATE_BROWSERS = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].filter(Boolean);

export function findBrowserExecutable() {
  return CANDIDATE_BROWSERS.find((path) => existsSync(path));
}

export async function openBrowser(config) {
  const executablePath = findBrowserExecutable();

  if (!executablePath) {
    throw new Error(
      "Nenhum Chrome/Edge foi encontrado. Instale o navegador ou defina CHROME_PATH."
    );
  }

  return puppeteer.launch({
    headless: config.headless,
    executablePath
  });
}
