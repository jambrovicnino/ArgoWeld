import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-300'>404</h1>
        <p className='mt-4 text-lg text-muted-foreground'>Stran ne obstaja</p>
        <Button asChild className='mt-6'>
          <Link to={ROUTES.DASHBOARD}>Nazaj na nadzorno ploščo</Link>
        </Button>
      </div>
    </div>
  );
}
