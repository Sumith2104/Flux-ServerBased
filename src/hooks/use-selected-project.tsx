
'use client';

import Cookies from 'js-cookie';
import type { Project } from '@/lib/data';

const COOKIE_NAME = 'selectedProject';

export function useSelectedProject() {
  const setSelectedProject = (project: Project | null) => {
    if (project) {
      Cookies.set(COOKIE_NAME, JSON.stringify(project), { expires: 365, path: '/' });
    } else {
      Cookies.remove(COOKIE_NAME, { path: '/' });
    }
    // Force a full page reload to the dashboard to ensure the server reads the new cookie
    window.location.href = '/dashboard';
  };

  const getSelectedProject = (): Project | null => {
    const cookie = Cookies.get(COOKIE_NAME);
    try {
        return cookie ? JSON.parse(cookie) : null;
    } catch (e) {
        return null;
    }
  };

  return { setSelectedProject, getSelectedProject };
}
