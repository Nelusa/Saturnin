import { NavLink } from "@remix-run/react";
import { Brain, BookOpen, Orbit, HardDrive, ArrowUpRight } from "lucide-react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "~/components/ui/sidebar";

export function DemoSidebar() {
  const { setOpenMobile } = useSidebar();
  return <Sidebar collapsible="offcanvas">
    <SidebarHeader className="p-5">
      <NavLink to="/knowledge/mindmaps" onClick={() => setOpenMobile(false)} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Orbit className="size-6" /></span>
        <span><span className="block text-lg font-semibold tracking-tight">Saturnin</span><span className="block text-xs text-muted-foreground">Místo pro propojené myšlení</span></span>
      </NavLink>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup><SidebarGroupLabel>Pracovní prostor</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
        {[{ to: "/knowledge/mindmaps", title: "Myšlenkové mapy", icon: Brain }, { to: "/knowledge/library", title: "Knihovna dokumentů", icon: BookOpen }].map(item => <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild className="h-11 [&[aria-current=page]]:bg-primary/10 [&[aria-current=page]]:text-primary [&[aria-current=page]]:font-medium">
            <NavLink to={item.to} onClick={() => setOpenMobile(false)}><item.icon /><span>{item.title}</span></NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup className="mt-3"><details className="group/prototype"><summary className="cursor-pointer rounded-md px-2 py-2 text-xs text-muted-foreground hover:text-foreground">Další části prototypu</summary>
        <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">Ukázky původního rozhraní diplomové práce. Nejde o hotové funkce.</p>
        <SidebarMenu>{[{ to: "/statistics", title: "Statistiky" }, { to: "/projects/DEMO", title: "Projekt" }, { to: "/knowledge/concepts", title: "Koncepty" }, { to: "/knowledge/tags", title: "Tagy" }].map(item => <SidebarMenuItem key={item.to}><SidebarMenuButton asChild><NavLink to={item.to} onClick={() => setOpenMobile(false)}>{item.title}</NavLink></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
      </details></SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="gap-4 p-5">
      <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"><HardDrive className="mb-2 size-4 text-primary" /><strong className="block text-foreground">Váš prohlížeč, vaše mapy</strong>Bez účtu a synchronizace. Pro přenos nebo zálohu použijte export JSON.</div>
      <a href="https://github.com/Nelusa/Saturnin" target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-muted-foreground hover:text-primary">O projektu a zdrojový kód<ArrowUpRight className="size-3.5" /></a>
    </SidebarFooter>
  </Sidebar>;
}
