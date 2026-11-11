import { afterEach, describe, expect, it, vi } from "vitest";
import { requireAuth, requireGuest } from "~/utils/authGuard";
import type { LoaderFunctionArgs } from "@remix-run/node";
const args = (url: string, method = "GET") =>
  ({ request: new Request(url, { method }), params: {}, context: {} }) as LoaderFunctionArgs;
afterEach(() => vi.unstubAllEnvs());
describe("public demo boundary", () => {
  it("permits demo reads without pretending to authenticate a person", async () => {
    vi.stubEnv("SATURNIN_DEMO", "true");
    expect(await requireAuth(args("http://localhost/knowledge"))).toEqual({ userId: "demo-visitor" });
  });
  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects %s even with the old simulated login flag", async (method) => {
    await expect(requireAuth(args("http://localhost/knowledge?simulateAuth=true", method))).rejects.toMatchObject({
      status: 403,
    });
  });
  it("throws the redirect when demo mode is disabled", async () => {
    vi.stubEnv("SATURNIN_DEMO", "false");
    await expect(requireAuth(args("http://localhost/knowledge?simulateAuth=true"))).rejects.toMatchObject({
      status: 302,
    });
  });
  it("does not treat a query flag as a real session on the login screen", async () => {
    expect(await requireGuest(args("http://localhost/login?simulateAuth=true"))).toBeNull();
  });
});
