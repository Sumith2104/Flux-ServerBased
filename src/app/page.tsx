import { getCurrentUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
  return null;
}
