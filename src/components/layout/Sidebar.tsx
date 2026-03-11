import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/router/routes';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  GitBranch,
  FolderKanban,
  Receipt,
  Car,
  FileSearch,
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'PREGLED',
    items: [
      { label: 'Nadzorna plošča', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
      { label: 'Opozorila', icon: AlertTriangle, path: ROUTES.OPOZORILA },
    ],
  },
  {
    title: 'KADRI',
    items: [
      { label: 'Delavci', icon: Users, path: ROUTES.DELAVCI },
      { label: 'Pipeline', icon: GitBranch, path: ROUTES.PIPELINE },
      { label: 'Dokumenti', icon: FileSearch, path: ROUTES.DOKUMENTI },
    ],
  },
  {
    title: 'POSLOVANJE',
    items: [
      { label: 'Projekti', icon: FolderKanban, path: ROUTES.PROJEKTI },
      { label: 'Stroški', icon: Receipt, path: ROUTES.STROSKI },
      { label: 'Vozila', icon: Car, path: ROUTES.VOZILA },
    ],
  },
  {
    title: 'SISTEM',
    items: [
      { label: 'Nastavitve', icon: Settings, path: ROUTES.NASTAVITVE },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen sidebar-gradient transition-sidebar hidden md:flex md:flex-col shadow-xl',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className='flex h-16 items-center justify-between px-4 border-b border-white/10'>
        {!sidebarCollapsed && (
          <Link to={ROUTES.DASHBOARD} className='flex items-center gap-2.5'>
            <div className='h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center'>
              <Flame className='h-5 w-5 text-white' />
            </div>
            <span className='font-bold text-lg text-white'>ArgoWeld</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link to={ROUTES.DASHBOARD} className='mx-auto'>
            <div className='h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center'>
              <Flame className='h-5 w-5 text-white' />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto py-4 px-2'>
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className='mb-4'>
            {!sidebarCollapsed && (
              <p className='px-3 mb-2 text-[10px] font-semibold tracking-wider text-white/40'>
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all mb-0.5',
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className='h-5 w-5 shrink-0' />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Toggle */}
      <div className='border-t border-white/10 p-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleSidebar}
          className='w-full text-white/70 hover:text-white hover:bg-white/10'
        >
          {sidebarCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </Button>
      </div>
    </aside>
  );
}
