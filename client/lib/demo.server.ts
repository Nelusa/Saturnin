import type { ProjectWithIssues } from "~/types";

/** Public prototype, deliberately separate from an authenticated service. */
export const isDemoMode = () => process.env.SATURNIN_DEMO !== "false";
export const demoProjects: ProjectWithIssues[] = [{
  code: "DEMO",
  title: "Propojené myšlení",
  initial_issue_state: "new",
  issues: [
    {
      code: "DEMO-1",
      title: "Zachytit nápad",
      description: "Z poznámky vytvořte uzel v myšlenkové mapě a propojte jej s dalším nápadem.",
      state: "new",
      last_modified: "2026-11-02T09:00:00Z",
    },
    {
      code: "DEMO-2",
      title: "Propojit souvislosti",
      description: "Ukázkový projekt. Změny úkolů slouží pouze k vyzkoušení rozhraní.",
      state: "in_progress",
      last_modified: "2026-11-02T09:00:00Z",
    },
  ],
}];

export async function loadProjects(): Promise<ProjectWithIssues[]> {
  if (isDemoMode()) return structuredClone(demoProjects);
  const origin = process.env.SATURNIN_API_URL ?? "http://localhost:8080";
  const response = await fetch(`${origin}/api/project`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Response("Služba projektů není dostupná", { status: 503 });
  const projects = await response.json() as ProjectWithIssues[];
  return Promise.all(projects.map(async (project) => {
    const issues = await fetch(`${origin}/api/project/${encodeURIComponent(project.code)}/issue`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!issues.ok) throw new Response("Úkoly se nepodařilo načíst", { status: 503 });
    return { ...project, issues: await issues.json() };
  }));
}
