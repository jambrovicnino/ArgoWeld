import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/router/routes';
import { LayoutDashboard, Users, FolderKanban, Car, Menu } from 'lucide-react';

const items = [
  { label: 'Plošča', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'Delavci', icon: Users, path: ROUTES.DELAVCI },
  { label: 'Projekti', icon: FolderKanban, path: ROUTES.PROJEKTI },
  { label: 'Vozila', icon: Car, path: ROUTES.VOZILA },
  { label: 'Več', icon: Menu, path: ROUTES.NASTAVITVE },
];

export function MobileNav() {
  const location = useLocation();
  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden'>
      <div className='flex justify-around'>
        {items.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 text-xs',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              <item.icon className='h-5 w-5' />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
