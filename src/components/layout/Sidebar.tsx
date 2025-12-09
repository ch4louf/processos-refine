import { Home, FileText, Users, Settings, HelpCircle, Plus, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const workspaces = [
  { id: 1, name: "Marketing", icon: "📊" },
  { id: 2, name: "Engineering", icon: "⚙️" },
  { id: 3, name: "Design", icon: "🎨" },
];

const navItems = [
  { icon: Home, label: "Dashboard", active: false },
  { icon: FileText, label: "All Processes", active: true },
  { icon: Users, label: "Team", active: false },
];

export const Sidebar = () => {
  return (
    <aside className="w-60 h-screen bg-sidebar flex flex-col sidebar-glow">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-sidebar-accent-foreground font-semibold text-lg tracking-tight">
          ProcessOS
        </span>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent step-transition text-left">
          <span className="text-lg">📊</span>
          <span className="text-sm font-medium text-sidebar-accent-foreground flex-1">Marketing</span>
          <ChevronDown className="w-4 h-4 text-sidebar-muted" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm step-transition",
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Workspaces */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Workspaces
            </span>
            <button className="p-1 rounded hover:bg-sidebar-accent step-transition">
              <Plus className="w-3.5 h-3.5 text-sidebar-muted" />
            </button>
          </div>
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground step-transition"
              >
                <span className="text-base">{workspace.icon}</span>
                {workspace.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground step-transition">
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground step-transition">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* User Profile */}
        <div className="mt-3 pt-3 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent step-transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-medium text-primary-foreground">
              JD
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-sidebar-accent-foreground">John Doe</p>
              <p className="text-xs text-sidebar-muted">john@company.com</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
