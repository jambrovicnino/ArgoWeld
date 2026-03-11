import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Settings, User, FolderKanban, ArrowRight } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
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

interface SearchResult {
  type: 'delavec' | 'projekt';
  id: number;
  label: string;
  sublabel: string;
  path: string;
}

export function Topbar() {
  const { toggleMobileMenu } = useUIStore();
  const navigate = useNavigate();
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    for (const d of delavci) {
      const fullName = `${d.ime} ${d.priimek}`.toLowerCase();
      if (fullName.includes(q)) {
        results.push({
          type: 'delavec',
          id: d.id,
          label: `${d.ime} ${d.priimek}`,
          sublabel: `${d.narodnost} · ${d.tipi_varjenja.join(', ')}`,
          path: ROUTES.DELAVEC_DETAIL(d.id),
        });
      }
    }

    for (const p of projekti) {
      if (p.naziv.toLowerCase().includes(q) || p.lokacija.toLowerCase().includes(q) || p.narocnik.toLowerCase().includes(q)) {
        results.push({
          type: 'projekt',
          id: p.id,
          label: p.naziv,
          sublabel: `${p.lokacija}, ${p.drzava} · ${p.narocnik}`,
          path: ROUTES.PROJEKT_DETAIL(p.id),
        });
      }
    }

    return results.slice(0, 8);
  }, [searchQuery, delavci, projekti]);

  function handleResultClick(path: string) {
    navigate(path);
    setSearchQuery('');
    setShowResults(false);
  }

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 md:px-6'>
      <Button variant='ghost' size='icon' className='md:hidden text-gray-600' onClick={toggleMobileMenu}>
        <Menu className='h-5 w-5' />
      </Button>

      <div className='flex-1 flex items-center gap-4'>
        <div ref={searchRef} className='relative hidden md:block w-full max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Išči delavce, projekte...'
            className='pl-9 bg-gray-50 border-gray-200'
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
          />
          {showResults && searchResults.length > 0 && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border shadow-lg overflow-hidden z-50'>
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  className='w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors'
                  onClick={() => handleResultClick(result.path)}
                >
                  {result.type === 'delavec' ? (
                    <User className='h-4 w-4 text-blue-500 shrink-0' />
                  ) : (
                    <FolderKanban className='h-4 w-4 text-emerald-500 shrink-0' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium truncate'>{result.label}</p>
                    <p className='text-xs text-muted-foreground truncate'>{result.sublabel}</p>
                  </div>
                  <ArrowRight className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                </button>
              ))}
            </div>
          )}
          {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border shadow-lg z-50 p-4 text-center'>
              <p className='text-sm text-muted-foreground'>Ni rezultatov za "{searchQuery}"</p>
            </div>
          )}
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
