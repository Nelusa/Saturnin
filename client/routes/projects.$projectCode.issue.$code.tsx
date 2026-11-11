import { loadProjects } from "~/lib/demo.server";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { IssueDetail } from "~/features/issues/detail/IssueDetail";
import { IssueFull } from "~/types";
import { useState } from "react";

export const meta: MetaFunction = ({ params }) => {
  return [
    { title: `Issue ${params.code} - ${params.projectCode} | Saturnin` },
    { name: "description", content: "Detailní informace o issue" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const projects = await loadProjects();
  const issue = projects.find((project) => project.code === params.projectCode)?.issues.find((issue) =>
    issue.code === params.code
  );
  if (!issue) throw new Response("Issue nenalezeno", { status: 404 });
  return issue;
}

export default function IssueDetailsPage() {
  const initialIssue = useLoaderData<typeof loader>();
  const [currentIssue, setCurrentIssue] = useState<IssueFull>(initialIssue);

  // TODO (NL): Implementovat možnost sledování změn v issue
  // TODO (NL): Implementovat možnost přidávání odkazů na související issues
  // TODO (NL): Implementovat možnost přidávání checklistů
  // TODO (NL): Implementovat možnost přidávání odhadu času
  // TODO (NL): Implementovat možnost přidávání milníků

  //TODO (NL): Implementovat úpravu issues
  const handleSave = async (updatedIssue: IssueFull) => {
    setCurrentIssue(updatedIssue);
  };

  const handleDelete = async () => {
    // TODO (NL): Implementovat mazání issue
    // console.log("Mazání...");
  };

  return (
    <div className="container mx-auto">
      <IssueDetail
        issue={currentIssue}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
