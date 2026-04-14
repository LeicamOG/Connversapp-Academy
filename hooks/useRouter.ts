import { useEffect, useState, useCallback } from 'react';
import type { ViewState } from '../types';

/**
 * Lightweight URL-driven router.
 *
 * We don't pull in `react-router-dom` to keep the bundle lean. Instead we map
 * the current `location.pathname` onto the existing `ViewState` enum and let
 * the App render the right view.
 *
 * URL shape:
 *   /                                       → HOME
 *   /login                                  → LOGIN
 *   /perfil                                 → MY_PROFILE
 *   /analytics                              → ADMIN_DASHBOARD
 *   /moderacao                              → MODERATION
 *   /construtor                             → BUILDER
 *   /usuarios                               → USERS
 *   /integracoes                            → INTEGRATIONS
 *   /storage-test                           → STORAGE_TEST
 *   /curso/:courseId                        → COURSE_DETAIL
 *   /curso/:courseId/aula/:lessonId         → PLAYER
 */

export interface Route {
    view: ViewState;
    courseId?: string;
    lessonId?: string;
}

const VIEW_PATH: Record<Exclude<ViewState, 'COURSE_DETAIL' | 'PLAYER'>, string> = {
    HOME: '/',
    LOGIN: '/login',
    MY_PROFILE: '/perfil',
    ADMIN_DASHBOARD: '/analytics',
    MODERATION: '/moderacao',
    BUILDER: '/construtor',
    USERS: '/usuarios',
    INTEGRATIONS: '/integracoes',
    STORAGE_TEST: '/storage-test',
};

/** Build the pathname for a given route. */
export function buildPath(route: Route): string {
    switch (route.view) {
        case 'COURSE_DETAIL':
            return route.courseId ? `/curso/${route.courseId}` : '/';
        case 'PLAYER':
            return route.courseId && route.lessonId
                ? `/curso/${route.courseId}/aula/${route.lessonId}`
                : '/';
        default:
            return VIEW_PATH[route.view];
    }
}

/** Parse the current pathname into a Route. */
export function parsePath(pathname: string): Route {
    // Trim trailing slash (but keep root "/" intact).
    const clean = pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;

    if (clean === '/' || clean === '') return { view: 'HOME' };

    // Match /curso/:id[/aula/:id]
    const courseMatch = clean.match(/^\/curso\/([^/]+)(?:\/aula\/([^/]+))?$/);
    if (courseMatch) {
        const [, courseId, lessonId] = courseMatch;
        return lessonId
            ? { view: 'PLAYER', courseId, lessonId }
            : { view: 'COURSE_DETAIL', courseId };
    }

    // Reverse lookup of static paths
    for (const [view, path] of Object.entries(VIEW_PATH) as [ViewState, string][]) {
        if (clean === path) return { view };
    }

    // Unknown path — fall back to home
    return { view: 'HOME' };
}

export function useRouter() {
    const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname));

    useEffect(() => {
        const handlePop = () => {
            setRoute(parsePath(window.location.pathname));
            // Reset scroll to top when navigating via back/forward
            window.scrollTo(0, 0);
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    const navigate = useCallback((next: Route | ViewState, opts?: { replace?: boolean }) => {
        const nextRoute: Route = typeof next === 'string' ? { view: next } : next;
        const path = buildPath(nextRoute);
        if (path === window.location.pathname) {
            // Still update state (e.g. same path, different query in the future).
            setRoute(nextRoute);
            return;
        }
        if (opts?.replace) {
            window.history.replaceState({}, '', path);
        } else {
            window.history.pushState({}, '', path);
        }
        setRoute(nextRoute);
        window.scrollTo(0, 0);
    }, []);

    return { route, navigate };
}
