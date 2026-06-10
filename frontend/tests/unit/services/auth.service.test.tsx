/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as any;

import * as auth from "@/services/authService";

function mockResponse({
  ok = true,
  status = 200,
  statusText = "OK",
  jsonData = {},
  textData = "",
  contentType = "application/json",
}: any) {
  return {
    ok,
    status,
    statusText,
    headers: {
      get: (key: string) => {
        if (key === "content-type") return contentType;
        return null;
      },
    },
    json: vi.fn().mockResolvedValue(jsonData),
    text: vi.fn().mockResolvedValue(textData),
  };
}

describe("authService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("should login successfully", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: { token: "abc", user: { id: 1, email: "test@test.com" } },
        })
      );

      const result = await auth.login({
        email: "test@test.com",
        password: "123456",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      );
      expect(result.token).toBe("abc");
      expect(result.user.email).toBe("test@test.com");
    });

    it("should throw error on login failure with message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 401,
          jsonData: { message: "Invalid credentials" },
        })
      );

      await expect(
        auth.login({ email: "x@x.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error on login failure without message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 500,
          jsonData: {},
        })
      );

      await expect(
        auth.login({ email: "x@x.com", password: "wrong" })
      ).rejects.toThrow("Falha ao fazer login.");
    });

    it("should handle text response fallback", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          contentType: "text/plain",
          textData: "Server error occurred",
        })
      );

      const result = await auth.login({
        email: "test@test.com",
        password: "123456",
      });

      expect(result).toEqual({ message: "Server error occurred" });
    });

    it("should handle empty text response", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          contentType: "text/plain",
          textData: "",
        })
      );

      const result = await auth.login({
        email: "test@test.com",
        password: "123456",
      });

      expect(result).toEqual({});
    });

    it("should handle invalid JSON response", async () => {
      const mockResponseObj = {
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") return "application/json";
            return null;
          },
        },
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        text: vi.fn().mockResolvedValue(""),
      };
      fetchMock.mockResolvedValueOnce(mockResponseObj as any);

      const result = await auth.login({
        email: "test@test.com",
        password: "123456",
      });

      expect(result).toEqual({});
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: { message: "User created", user: { id: 1, email: "new@test.com" } },
        })
      );

      const result = await auth.register({
        email: "new@test.com",
        password: "123456",
        name: "New User",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "new@test.com",
            password: "123456",
            name: "New User",
          }),
        })
      );
      expect(result.user.id).toBe(1);
    });

    it("should register with optional fields", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: { message: "User created", user: { id: 1 } },
        })
      );

      const result = await auth.register({
        email: "new@test.com",
        password: "123456",
        name: "New User",
        phone: "+5511999999999",
        cpf: "12345678901",
      });

      expect(result.user.id).toBe(1);
      const callArgs = fetchMock.mock.calls[0][1];
      expect(JSON.parse(callArgs.body)).toEqual({
        email: "new@test.com",
        password: "123456",
        name: "New User",
      });
    });

    it("should throw error on register failure with message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 400,
          jsonData: { message: "Email already exists" },
        })
      );

      await expect(
        auth.register({
          email: "existing@test.com",
          password: "123456",
          name: "Existing",
        })
      ).rejects.toThrow("Email already exists");
    });

    it("should throw error on register failure without message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 500,
          jsonData: {},
        })
      );

      await expect(
        auth.register({
          email: "test@test.com",
          password: "123456",
          name: "Test",
        })
      ).rejects.toThrow("Falha ao cadastrar: 500 OK");
    });

    it("should handle text response on register", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: true,
          contentType: "text/plain",
          textData: "Registration successful",
        })
      );

      const result = await auth.register({
        email: "test@test.com",
        password: "123456",
        name: "Test User",
      });

      expect(result).toEqual({ message: "Registration successful" });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: {},
        })
      );

      await expect(auth.logout()).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        })
      );
    });

    it("should throw on logout failure with message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 500,
          jsonData: { message: "Session expired" },
        })
      );

      await expect(auth.logout()).rejects.toThrow("Session expired");
    });

    it("should throw on logout failure without message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 500,
          jsonData: {},
        })
      );

      await expect(auth.logout()).rejects.toThrow("Falha ao fazer logout.");
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user successfully", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: { id: 1, name: "Bene", email: "bene@test.com" },
        })
      );

      const user = await auth.getCurrentUser();
      expect(user.name).toBe("Bene");
      expect(user.email).toBe("bene@test.com");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/me"),
        { credentials: "include" }
      );
    });

    it("should throw when getCurrentUser fails with message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 401,
          jsonData: { message: "Not authenticated" },
        })
      );

      await expect(auth.getCurrentUser()).rejects.toThrow("Not authenticated");
    });

    it("should throw when getCurrentUser fails without message", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 403,
          jsonData: {},
        })
      );

      await expect(auth.getCurrentUser()).rejects.toThrow("Falha ao carregar usuário.");
    });
  });

  describe("buildApiUrl with base URL", () => {
    it("should use VITE_API_BASE_URL when configured", async () => {
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      import.meta.env.VITE_API_BASE_URL = "https://api.example.com";
      
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          jsonData: { token: "abc" },
        })
      );

      await auth.login({ email: "test@test.com", password: "123456" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/auth/login",
        expect.any(Object)
      );
      
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    });
  });
});