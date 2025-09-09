
'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {login} from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


function parseCsv(data: string) {
  if (!data) return [];
  const rows = data.trim().split('\n');
  if (rows.length < 2) return [];
  const header = rows[0].split(',');
  return rows.slice(1).map(row => {
      const values = row.split(',');
      return header.reduce((obj, nextKey, index) => {
          obj[nextKey.trim()] = values[index]?.trim().replace(/^"|"$/g, '');
          return obj;
      }, {} as Record<string, string>);
  });
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  
  const dbPath = path.join(process.cwd(), 'src', 'database');
  const usersCsvPath = path.join(dbPath, 'users.csv');
  
  let usersData;
  try {
    usersData = await fs.readFile(usersCsvPath, 'utf8');
  } catch(e) {
    return { error: 'Invalid email or password.' };
  }

  const users = parseCsv(usersData);
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  // NOTE: In a real app, passwords should be hashed.
  // This is a direct comparison for demonstration purposes.
  if (user.password !== password) {
    return { error: 'Invalid email or password.' };
  }
  
  await login(user.id);
  
  // Clear selected project cookie on login to start fresh
  cookies().delete('selectedProject');

  return { success: true, userId: user.id };
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; // In a real app, hash and salt this!

  if (!email || !password) {
    return {error: 'Email and password are required.'};
  }

  const dbPath = path.join(process.cwd(), 'src', 'database');
  const usersCsvPath = path.join(dbPath, 'users.csv');

  try {
    let usersData = '';
    try {
        usersData = await fs.readFile(usersCsvPath, 'utf8');
    } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
        // File doesn't exist, which is fine. It will be created.
    }
    
    const users = parseCsv(usersData);
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        return { error: 'An account with this email already exists.' };
    }

    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    const newUserCsvRow = `\n${userId},${email},${password},${createdAt}`;

    const userFolderPath = path.join(dbPath, userId);

    // 1. Create database directory if it doesn't exist
    await fs.mkdir(dbPath, {recursive: true});

    // 2. Append user to users.csv
    if (usersData) {
        await fs.appendFile(usersCsvPath, newUserCsvRow, 'utf8');
    } else {
        // If file doesn't exist, create it with header
        const header = 'id,email,password,created_at';
        await fs.writeFile(usersCsvPath, header + newUserCsvRow, 'utf8');
    }

    // 3. Create user's root folder
    await fs.mkdir(userFolderPath, {recursive: true});

    // 4. "Log in" the user by setting a session cookie
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
