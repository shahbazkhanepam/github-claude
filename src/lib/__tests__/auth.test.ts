import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("jose");
vi.mock("next/headers");

import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { createSession } from "../auth";

describe("createSession", () => {
  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockToken = "mock-jwt-token";

  let mockCookieStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  it("should create a JWT token and set it in cookies", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue(mockToken),
    };

    vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

    await createSession(mockUserId, mockEmail);

    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        email: mockEmail,
      })
    );

    expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({
      alg: "HS256",
    });
    expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
    expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
    expect(mockSignJWT.sign).toHaveBeenCalled();

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      mockToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("should set secure flag to true in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue(mockToken),
    };

    vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

    await createSession(mockUserId, mockEmail);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      mockToken,
      expect.objectContaining({
        secure: true,
      })
    );

    vi.unstubAllEnvs();
  });

  it("should set secure flag to false in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue(mockToken),
    };

    vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

    await createSession(mockUserId, mockEmail);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      mockToken,
      expect.objectContaining({
        secure: false,
      })
    );

    vi.unstubAllEnvs();
  });
});
