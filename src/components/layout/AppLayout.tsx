import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { useUIStore } from '@/stores/uiStore';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useExpensesStore } from '@/stores/expensesStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore();
  const initWorkers = useWorkersStore((s) => s.init);
  const initProjects = useProjectsStore((s) => s.init);
  const initExpenses = useExpensesStore((s) => s.init);
  const initPipeline = usePipelineStore((s) => s.init);

  useEffect(() => {
    initWorkers();
    initProjects();
    initExpenses();
    initPipeline();
  }, [initWorkers, initProjects, initExpenses, initPipeline]);

  return (
    <div className='min-h-screen bg-background'>
      <Sidebar />
      <div className={cn('transition-sidebar', sidebarCollapsed ? 'md:ml-16' : 'md:ml-64')}>
        <Topbar />
        <main className='p-4 md:p-6 pb-20 md:pb-6'>
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
