import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building, 
  PenTool, 
  FileText, 
  TrendingUp, 
  Megaphone,
  Settings,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();

  const navigation = [
    { name: "Painel", href: "/", icon: LayoutDashboard },
    { name: "Imóveis", href: "/properties", icon: Building },
    { name: "Gerar Post", href: "/generate", icon: PenTool },
    { name: "Posts Salvos", href: "/posts", icon: FileText },
    { name: "Análise e Insights", href: "/analysis", icon: TrendingUp },
    { name: "Campanhas", href: "/campaigns", icon: Megaphone },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold tracking-tight text-sidebar-primary flex items-center gap-2">
            <Building className="w-5 h-5" />
            ImóvelPost
          </h1>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-4">
          <div className="flex items-center justify-between px-3 py-2 text-xs">
            <span className="text-sidebar-foreground/70">API Status</span>
            {health ? (
              <span className="flex items-center gap-1.5 text-chart-3 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3"></span>
                </span>
                Online
              </span>
            ) : isError ? (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            ) : (
              <span className="text-muted-foreground">Conectando...</span>
            )}
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 cursor-not-allowed">
            <Settings className="w-4 h-4" />
            Configurações
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8">
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              IP
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
