import {SidebarInset, SidebarProvider, SidebarTrigger} from "~/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import {useLocation, Link} from "@remix-run/react";
import {Fragment, ReactNode} from "react";
import {AppSidebar} from "~/components/layout/AppSidebar";
import {Separator} from "~/components/ui/separator";
import {ProjectWithIssues} from "~/types";
import {getBreadcrumbs} from "~/utils/helpers";
import {sidebarItems} from "~/lib/data";
import {Toaster} from "~/components/ui/toaster";
import {ThemeToggle} from "~/features/darkMode/ThemeToggle";
import {CommandSearch} from "~/features/search/CommandSearch";

interface AppLayoutProps {
  children: ReactNode;
  projects: ProjectWithIssues[];
  demo?: boolean;
}

const AppLayout = ({ children, projects, demo }: AppLayoutProps) => {
  const location = useLocation();
  const allNavItems = [
    ...sidebarItems.navMain,
    ...sidebarItems.navSettings
  ];
  const breadcrumbs = getBreadcrumbs(location.pathname, allNavItems);

  return (
      <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-background focus:p-3">Přejít na obsah</a>
        <SidebarProvider>
          <AppSidebar projects={projects}/>
          <SidebarInset className="relative flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
              <div className="flex items-center gap-2 px-3 flex-1">
                <SidebarTrigger/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((item, index) => (
                        <Fragment key={item.path}>
                          {index > 0 && <BreadcrumbSeparator/>}
                          <BreadcrumbItem>
                            {item.isLast ? (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={item.path}>
                                  {item.label}
                                </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex items-center gap-2">
                  <CommandSearch projects={projects} />
                  <ThemeToggle/>
                </div>
              </div>
            </header>
            {demo && <aside className="shrink-0 border-b bg-primary/5 px-4 py-2 text-xs leading-relaxed text-muted-foreground sm:px-6" aria-label="O veřejné ukázce">
              <strong className="text-foreground">Veřejná ukázka</strong> · Mapy ukládáte do tohoto prohlížeče. Dokumenty jsou k prohlížení; ostatní části ukazují prototyp rozhraní.
              {" "}<Link to="/knowledge/mindmaps" className="font-medium text-primary underline underline-offset-2">Moje mapy</Link>
            </aside>}
            <main id="main-content" className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </main>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </div>
  );
};

export default AppLayout;
