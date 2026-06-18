import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  User as UserIcon,
  ClipboardCheck,
  Menu,
  Search,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Discover Jobs", href: "/discover", icon: Search },
    { name: "My Jobs", href: "/jobs", icon: Briefcase },
    { name: "Applications", href: "/applications", icon: ClipboardCheck },
    { name: "Resume", href: "/resume", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              isActive
                ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                : "text-white/50 hover:text-white/85 hover:bg-white/5"
            }`}
          >
            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-400" : "text-white/40"}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-tight block">Job Scout</span>
            <span className="text-white/40 text-xs">Pro AI</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-white/25 text-xs font-semibold tracking-widest uppercase px-3 mb-2 mt-2">Navigation</p>
        <NavLinks onNavigate={onNavigate} />
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 h-auto py-2.5 hover:bg-white/5 rounded-xl text-white/70 hover:text-white"
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                  {initials || <UserIcon className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-xs min-w-0">
                <span className="font-medium text-white/80 truncate w-36">{email || "User"}</span>
                <span className="text-white/35 text-[10px]">Signed in</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 text-white/80">
            <DropdownMenuLabel className="text-white/50 text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
              <Link href="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut().then(() => { window.location.href = basePath || "/"; })}
              className="text-red-400 focus:text-red-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style={{ background: "rgba(10,10,30,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 font-bold text-white">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm">Job Scout Pro AI</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-white/10"
            style={{ background: "rgba(10,10,28,0.97)", backdropFilter: "blur(30px)" }}>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-col fixed inset-y-0 z-10"
        style={{ background: "rgba(8,8,24,0.7)", backdropFilter: "blur(30px) saturate(200%)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <main className="flex-1 md:pl-60 flex flex-col min-h-[100dvh]">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
