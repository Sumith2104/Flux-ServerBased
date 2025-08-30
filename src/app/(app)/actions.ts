
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';

/**
 * Server action to log in a user. For demonstration, it logs in a fixed user.
 * In a real app, this would take credentials from formData.
 */
export async function loginAction() {
    // In a real app, you would validate credentials from a form.
    // For this demo, we log in a default user.
    await login('123e4567-e89b-12d3-a456-426614174000');
    redirect('/dashboard');
}

/**
 * Server action to log out the current user.
 */
export async function logoutAction() {
    await logout();
    // Also clear the selected project cookie on logout.
    cookies().delete('selectedProject');
    redirect('/login');
}
