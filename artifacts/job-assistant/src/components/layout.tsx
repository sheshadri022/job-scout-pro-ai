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
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Applications", href: "/applications", icon: ClipboardCheck },
    { name: "Resume", href: "/resume", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-slate-500"}`}
            />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <Briefcase className="w-5 h-5" />
          Job Scout
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-lg text-primary">
                <Briefcase className="w-5 h-5" />
                Job Scout Pro AI
              </div>
            </div>
            <nav className="p-4 space-y-1">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white border-r border-slate-200 z-10">
        <div className="p-6 flex items-center gap-2 font-bold text-xl text-primary">
          <Briefcase className="w-6 h-6" />
          Job Scout Pro AI
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-slate-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2 h-auto py-2"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials || <UserIcon className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium text-slate-900 truncate w-32">
                    {email || "User"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="cursor-pointer flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  signOut().then(() => {
                    window.location.href = basePath || "/";
                  })
                }
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:pl-64 flex flex-col">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
