import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { DelavciListPage } from '@/pages/workers/DelavciListPage';
import { DelavecCreatePage } from '@/pages/workers/DelavecCreatePage';
import { DelavecDetailPage } from '@/pages/workers/DelavecDetailPage';
import { ProjektiListPage } from '@/pages/projects/ProjektiListPage';
import { ProjektCreatePage } from '@/pages/projects/ProjektCreatePage';
import { ProjektDetailPage } from '@/pages/projects/ProjektDetailPage';
import { StroskiListPage } from '@/pages/expenses/StroskiListPage';
import { StrosekCreatePage } from '@/pages/expenses/StrosekCreatePage';
import { VozilaPage } from '@/pages/VozilaPage';
import { VoziloDetailPage } from '@/pages/vehicles/VoziloDetailPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { DokumentiPage } from '@/pages/DokumentiPage';
import { OpozorilaPage } from '@/pages/OpozorilaPage';
import { NastavitivePage } from '@/pages/NastavitivePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'delavci', element: <DelavciListPage /> },
      { path: 'delavci/nov', element: <DelavecCreatePage /> },
      { path: 'delavci/:id', element: <DelavecDetailPage /> },
      { path: 'projekti', element: <ProjektiListPage /> },
      { path: 'projekti/nov', element: <ProjektCreatePage /> },
      { path: 'projekti/:id', element: <ProjektDetailPage /> },
      { path: 'stroski', element: <StroskiListPage /> },
      { path: 'stroski/nov', element: <StrosekCreatePage /> },
      { path: 'vozila', element: <VozilaPage /> },
      { path: 'vozila/:id', element: <VoziloDetailPage /> },
      { path: 'pipeline', element: <PipelinePage /> },
      { path: 'dokumenti', element: <DokumentiPage /> },
      { path: 'opozorila', element: <OpozorilaPage /> },
      { path: 'nastavitve', element: <NastavitivePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
