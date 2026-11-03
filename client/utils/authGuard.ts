import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { isDemoMode } from "~/lib/demo.server";

/** Until real sessions exist, never authorize shared writes using a URL flag. */
export async function requireAuth({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    throw new Response("Veřejné demo nemění sdílené dokumenty. Vyzkoušejte vlastní myšlenkovou mapu uloženou v tomto prohlížeči.", { status: 403 });
  }
  if (isDemoMode()) return { userId: "demo-visitor" };
  const url = new URL(request.url);
  throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`);
}

export async function requireGuest(_args: LoaderFunctionArgs) {
  void _args;
  return null;
}
