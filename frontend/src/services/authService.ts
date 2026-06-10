/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeBaseUrl(value: string | undefined): string {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function getApiBaseUrl(): string {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configuredBaseUrl) {
    console.log("Usando VITE_API_BASE_URL:", configuredBaseUrl);
    return configuredBaseUrl;
  }
  console.log(" Sem VITE_API_BASE_URL, usando caminho relativo");
  return "";
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  const fullUrl = baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
  console.log(" Construindo URL:", { path, baseUrl, fullUrl });
  return fullUrl;
}

async function readPayload(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers?.get?.("content-type") ?? "";
  console.log(" Content-Type:", contentType);
  
  if (!contentType || contentType.includes("application/json")) {
    try {
      const payload = await response.json();
      console.log(" Payload JSON:", payload);
      return payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    } catch (error) {
      console.log(" Erro ao parsear JSON:", error);
      return {};
    }
  }
  
  if (typeof response.text === "function") {
    const text = await response.text();
    console.log("Resposta texto:", text);
    return text ? { message: text } : {};
  }
  
  return {};
}

function buildError(message: unknown, fallback: string): Error {
  const errorMsg = typeof message === "string" && message ? message : fallback;
  console.error("Erro construído:", errorMsg);
  return new Error(errorMsg);
}

function readMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cpf?: string;
}

export async function login(credentials: LoginCredentials): Promise<{ token?: string; user?: any; message?: string }> {
  console.log("Iniciando login com:", { email: credentials.email });
  const url = buildApiUrl("/api/auth/login");
  console.log("URL:", url);
  console.log("Método: POST");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    credentials: "include",
  });
  
  console.log("Status da resposta:", response.status);
  console.log("Status text:", response.statusText);
  
  const payload = await readPayload(response);
  
  if (!response.ok) {
    console.error("Login falhou:", payload);
    throw buildError(readMessage(payload), "Falha ao fazer login.");
  }
  
  console.log("Login bem sucedido:", payload);
  return payload;
}

export async function register(userData: RegisterData): Promise<{ message?: string; user?: any }> {
  console.log("Iniciando registro com:", { email: userData.email, name: userData.name });
  const url = buildApiUrl("/api/auth/register");
  console.log("URL:", url);
  console.log("Método: POST");
  
  const bodyData = {
    email: userData.email,
    password: userData.password,
    name: userData.name,
  };
  console.log("Body enviado:", bodyData);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
    credentials: "include",
  });
  
  console.log("Status da resposta:", response.status);
  console.log("Status text:", response.statusText);
  console.log("Headers:", {
    contentType: response.headers.get("content-type"),
    cors: response.headers.get("access-control-allow-origin"),
  });
  
  const payload = await readPayload(response);
  
  if (!response.ok) {
    console.error(" Registro falhou:", { status: response.status, payload });
    throw buildError(readMessage(payload), `Falha ao cadastrar: ${response.status} ${response.statusText}`);
  }
  
  console.log(" Registro bem sucedido:", payload);
  return payload;
}

export async function logout(): Promise<void> {
  console.log(" Iniciando logout");
  const url = buildApiUrl("/api/auth/logout");
  console.log(" URL:", url);
  
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  });
  
  console.log(" Status:", response.status);
  
  if (!response.ok) {
    const payload = await readPayload(response);
    console.error(" Logout falhou:", payload);
    throw buildError(readMessage(payload), "Falha ao fazer logout.");
  }
  
  console.log("Logout bem sucedido");
}

export async function getCurrentUser(): Promise<any> {
  console.log("🚀 Buscando usuário atual");
  const url = buildApiUrl("/api/auth/me");
  console.log("URL:", url);
  
  const response = await fetch(url, {
    credentials: "include",
  });
  
  console.log("📡 Status:", response.status);
  const payload = await readPayload(response);
  
  if (!response.ok) {
    console.error(" Busca falhou:", payload);
    throw buildError(readMessage(payload), "Falha ao carregar usuário.");
  }
  
  console.log(" Usuário encontrado:", payload);
  return payload;
}