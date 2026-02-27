// src/components/MainLayout.jsx

import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  ChefHat,
  BarChart3,
  ScanLine,
  Settings,
  LogOut,
  FileText,
  Menu,
  Users,
  AlertTriangle,
  Activity,
  Key,
  X,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import OnboardingTour from '@/components/OnboardingTour';

const SidebarContent = ({ location, user, isAdmin, onSignOut, onItemClick }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Planner', path: '/' },
    { icon: UtensilsCrossed, label: 'Recipes', path: '/recipes' },

    // REQUIRED: 3rd item, between Recipes and Shopping List
    { icon: Sparkles, label: 'AI Recipe Generator', path: '/ai-recipe-generator' },

    { icon: ShoppingCart, label: 'Shopping List', path: '/shopping-list' },
    { icon: Package, label: 'Pantry', path: '/pantry' },
    { icon: ChefHat, label: 'Recipe Builder', path: '/builder' },
    { icon: BarChart3, label: 'Progress', path: '/progress' },
    { icon: ScanLine, label: 'Scanner', path: '/scanner' },
    { icon: FileText, label: 'Reports', path: '/reports' },
  ];

  const adminItems = [
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: AlertTriangle, label: 'Alerts Monitor', path: '/admin/alerts' },
    { icon: Activity, label: 'System Events', path: '/admin/events' },
    { icon: Key, label: 'API Keys', path: '/admin/api-keys' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B1120] text-slate-300 border-r border-slate-800">
      <div className="p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="https://horizons-cdn.hostinger.com/dcac26d1-acf4-4e36-b028-056c34ad9fa9/5540cb1f979b0d437737bdd9bbc95052.png"
            alt="Keto Contractor Logo"
            className="w-9 h-9 object-contain"
          />
          <div className="leading-tight">
            <div className="font-bold text-white tracking-tight">Keto</div>
            <div className="font-bold text-white tracking-tight">Contractor</div>
          </div>
        </div>

        {onItemClick && (
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <X className="w-5 h-5" />
            </Button>
          </SheetClose>
        )}
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col">
        <ScrollArea className="flex-1 px-3 py-2" type="always">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onItemClick}
                  className={`
                    flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all duration-200 group
                    ${
                      isActive
                        ? 'bg-[#1e293b] text-cyan-400 font-medium border-l-2 border-cyan-500'
                        : 'text-slate-400 hover:text-white hover:bg-[#1e293b]/50'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 md:w-4 md:h-4 transition-transform ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="text-base md:text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Links - Gated by isAdmin */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administration
                </div>
                <div className="space-y-1">
                  {adminItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onItemClick}
                        className={`
                          flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all duration-200 group
                          ${
                            isActive
                              ? 'bg-red-950/20 text-red-400 font-medium border-l-2 border-red-500'
                              : 'text-slate-400 hover:text-red-300 hover:bg-red-950/10'
                          }
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 md:w-4 md:h-4 ${
                            isActive ? 'text-red-500' : 'text-slate-500 group-hover:text-red-400'
                          }`}
                        />
                        <span className="text-base md:text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 mt-auto space-y-2 shrink-0 bg-[#0B1120]">
          <Link
            to="/preferences"
            onClick={onItemClick}
            className={`
              flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all duration-200 group
              ${
                location.pathname === '/preferences'
                  ? 'bg-[#1e293b] text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e293b]/50'
              }
            `}
          >
            <Settings className="w-5 h-5 md:w-4 md:h-4 transition-transform group-hover:rotate-90" />
            <span className="text-base md:text-sm">Preferences</span>
          </Link>

          <div className="pt-2">
            <div className="bg-[#131b2e] rounded-lg p-3 border border-slate-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-900/20">
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{user?.email || 'Guest User'}</div>
                  <div className="text-[10px] text-slate-500 truncate">Contractor Plan</div>
                </div>
              </div>

              {/* AUDIT VERIFIED: Explicit type="button" */}
              <button
                type="button"
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 py-2 rounded-md transition-colors h-10 md:h-auto"
              >
                <LogOut className="w-4 h-4 md:w-3 md:h-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// IMPORTANT: React Router layout routes render children via <Outlet />
export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isPlanner = location.pathname === '/';

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-[#0B1120] z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://horizons-cdn.hostinger.com/dcac26d1-acf4-4e36-b028-056c34ad9fa9/5540cb1f979b0d437737bdd9bbc95052.png"
            alt="Keto Contractor Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-white text-base">Keto Contractor</span>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-10 w-10">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px] border-r border-slate-800 bg-[#0B1120]">
            <SidebarContent
              location={location}
              user={user}
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
              onItemClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden md:flex w-64 lg:w-72 bg-[#0B1120] border-r border-slate-800 flex-col shrink-0 z-20 transition-all duration-300">
        <SidebarContent location={location} user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </aside>

      <main
        className={`flex-1 flex flex-col min-w-0 relative ${
          isPlanner ? 'pt-16 md:pt-0 overflow-hidden' : 'pt-16 md:pt-0 overflow-y-scroll'
        }`}
      >
        {isPlanner ? (
          <div className="h-full w-full bg-[#0f172a] flex flex-col">
            <Outlet />
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-20">
            <Outlet />
          </div>
        )}
      </main>

      <OnboardingTour />
    </div>
  );
}

export default MainLayout;