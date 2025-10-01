
'use server';

import {v4 as uuidv4} from 'uuid';
import {login} from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  
  // This is a mock login. In a real app, you would validate credentials.
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  await login(userId);
  
  cookies().delete('selectedProject');

  return { success: true, userId: userId };
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; // In a real app, hash and salt this!

  if (!email || !password) {
    return {error: 'Email and password are required.'};
  }

  try {
    // Mock signup
    const userId = uuidv4();
    await login(userId);
    return {success: true, userId};
  } catch (error) {
    console.error('Signup failed:', error);
    return {error: 'An unexpected error occurred.'};
  }
}

export async function selectProjectAction(formData: FormData) {
    const projectString = formData.get('project') as string;
    if (projectString) {
        cookies().set('selectedProject', projectString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });
    } else {
        cookies().delete('selectedProject');
    }
    // No longer redirecting from here, client-side will handle it.
}
