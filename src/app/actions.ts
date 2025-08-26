'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {login} from '@/lib/auth';

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; // In a real app, hash and salt this!

  if (!email || !password) {
    return {error: 'Email and password are required.'};
  }

  try {
    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    const newUserCsvRow = `\n${userId},${email},${createdAt}`;

    const dbPath = path.join(process.cwd(), 'src', 'database');
    const usersCsvPath = path.join(dbPath, 'users.csv');
    const userFolderPath = path.join(dbPath, userId);

    // 1. Create database directory if it doesn't exist
    await fs.mkdir(dbPath, {recursive: true});

    // 2. Append user to users.csv
    try {
      await fs.appendFile(usersCsvPath, newUserCsvRow, 'utf8');
    } catch (error) {
      // If file doesn't exist, create it with header
      const header = 'id,email,created_at';
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
