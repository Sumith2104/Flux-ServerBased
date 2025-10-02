
'use server';

import {v4 as uuidv4} from 'uuid';
import {login} from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // In a real app, you would use bcrypt.compare here
  if (!user || user.password !== password) {
    return { error: 'Invalid email or password.' };
  }
  
  await login(user.id);
  
  cookies().delete('selectedProject');

  return { success: true, userId: user.id };
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; // In a real app, hash and salt this!

  if (!email || !password) {
    return {error: 'Email and password are required.'};
  }

  try {
     const existingUser = await prisma.user.findUnique({ where: { email } });
     if (existingUser) {
        return { error: 'A user with this email already exists.' };
     }

    // In a real app, you should hash the password with bcrypt
    const user = await prisma.user.create({
      data: {
        email: email,
        password: password, // HASH THIS in a real app
      },
    });

    await login(user.id);
    cookies().delete('selectedProject');
    
    return {success: true, userId: user.id};

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
