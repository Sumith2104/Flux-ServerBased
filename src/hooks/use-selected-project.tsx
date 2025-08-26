
'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import type { Project } from '@/lib/data';

const COOKIE_NAME = 'selectedProject';

export function useSelectedProject() {
  const router = useRouter();

  const setSelectedProject = (project: Project | null) => {
    if (project) {
      Cookies.set(COOKIE_NAME, JSON.stringify(project), { expires: 365, path: '/' });
    } else {
      Cookies.remove(COOKIE_NAME, { path: '/' });
    }
    // Refresh the page to apply the new project context server-side
    router.refresh();
  };

  const getSelectedProject = (): Project | null => {
    const cookie = Cookies.get(COOKIE_NAME);
    return cookie ? JSON.parse(cookie) : null;
  };

  return { setSelectedProject, getSelectedProject };
}
