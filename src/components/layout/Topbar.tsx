import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/router/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar() {
  const { toggleMobileMenu } = useUIStore();
  const navigate = useNavigate();

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 md:px-6'>
      <Button variant='ghost' size='icon' className='md:hidden text-gray-600' onClick={toggleMobileMenu}>
        <Menu className='h-5 w-5' />
      </Button>

      <div className='flex-1 flex items-center gap-4'>
        <div className='relative hidden md:block w-full max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input placeholder='Išči projekte, delavce...' className='pl-9 bg-gray-50 border-gray-200' />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          className='relative text-gray-500 hover:text-blue-500'
          onClick={() => navigate(ROUTES.OPOZORILA)}
        >
          <Bell className='h-5 w-5' />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-9 w-9 rounded-full'>
              <Avatar className='h-9 w-9'>
                <AvatarFallback className='bg-blue-500 text-white text-xs font-semibold'>
                  NJ
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end'>
            <DropdownMenuLabel>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium'>Nino Jambrovic</p>
                <p className='text-xs text-muted-foreground'>Direktor</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTES.NASTAVITVE)}>
              <Settings className='mr-2 h-4 w-4' />
              Nastavitve
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
