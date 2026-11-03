import { isDemoMode, loadProjects } from "~/lib/demo.server";
import type { ProjectWithIssues } from "~/types";
import type { LinksFunction } from "@remix-run/node";
import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation, isRouteErrorResponse, useRouteError} from "@remix-run/react";
import "./styles/tailwind.css";
import { createDragDropManager } from "dnd-core";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { initializeConceptsIfEmpty } from "~/utils/knowledge/conceptUtils";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import AppLayout from "~/components/layout/AppLayout";
import { ThemeProvider } from "~/features/darkMode/ThemeProvider";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const manager = createDragDropManager(HTML5Backend);

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeConceptsIfEmpty();
  }, []);

  return mounted ? children : null;
};

// TODO (NL): Implementovat správné načítání projektů s paginací pro velké množství dat
export const loader = async () => {
  return { projects: await loadProjects(), demo: isDemoMode() };
};

const themeScript = `
(function() {
  const theme = localStorage.getItem('theme') || 'system';
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme === 'dark' || (theme === 'system' && prefersDarkMode)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
`;

// TODO (NL): Nutno použít i tento Layout?
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="cs"
      suppressHydrationWarning
    >
    <head>
      <meta charSet="utf-8"/>
      <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
      />
      {/*<link rel="icon" href="/favicon.ico"/>*/}
      <Meta/>
      <Links/>
      <script dangerouslySetInnerHTML={{__html: themeScript}}/>
    </head>
    <body>
    {children}
    <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// TODO (NL): Implementovat správnou autentizaci a autorizaci
function AuthLayout() {
  return (
      <ThemeProvider>
        <div className="min-h-svh">
          <Outlet />
        </div>
      </ThemeProvider>
  );
}

function AppLayoutWrapper({ projects, demo }: { projects: ProjectWithIssues[]; demo: boolean }) {
  return (
      <ThemeProvider>
        <DndProvider
            manager={manager}
            backend={HTML5Backend}
        >
          <AppLayout projects={projects} demo={demo}>
            <Outlet />
          </AppLayout>
        </DndProvider>
      </ThemeProvider>
  );
}

// TODO (NL): Přidat error boundary pro lepší zachycení chyb
export default function App() {
  const { projects, demo } = useLoaderData<typeof loader>();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname === "/reset-password";


  return (
      <ClientOnly>
        {isAuthPage ? (
            <AuthLayout />
        ) : (
            <AppLayoutWrapper projects={projects} demo={demo} />
        )}
      </ClientOnly>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return <main className="mx-auto max-w-xl p-8 space-y-4">
    <h1 className="text-2xl font-semibold">{status === 404 ? "Stránka nebyla nalezena" : "Tuto část se nepodařilo načíst"}</h1>
    <p>Vaše uložené myšlenkové mapy zůstávají v tomto prohlížeči. Zkuste se vrátit do ukázky.</p>
    <a className="underline" href="/knowledge/mindmaps">Otevřít myšlenkové mapy</a>
  </main>;
}
