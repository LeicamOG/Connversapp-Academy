
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { HomeView, CourseDetailView, PlayerView, Builder, Analytics, LoginView, UserPanel, UserProfile, ModerationView, IntegrationsView } from './components/Views';
import StorageTest from './components/StorageTest';
import { getCourseById } from './services/data';
import { SettingsService, AuthService, CourseService, supabase } from './services/supabase';
import { UserRole, ThemeConfig, User, Course } from './types';
import type { ViewState } from './types';
import { Loader2 } from 'lucide-react';
import { useRouter, buildPath } from './hooks/useRouter';

const App: React.FC = () => {
  const { route, navigate } = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>({ primaryColor: '', secondaryColor: '', logoUrl: '', siteName: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const loadCourses = useCallback(async () => {
    const fetchedCourses = await CourseService.getAll();
    setCourses(fetchedCourses);
  }, []);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Initialization timeout - proceeding to login');
          setIsLoading(false);
        }, 3000);

        await AuthService.initializeDefaultAdmin().catch(e => console.warn('Admin init warning:', e));
        const currentUser = await AuthService.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          // Load courses in the background — the landing view doesn't need them
          // to render its skeletons.
          loadCourses().catch(e => console.error('Bg course load error:', e));
        }

        SettingsService.getTheme().then(fetchedTheme => {
          setTheme(fetchedTheme);
          document.documentElement.style.setProperty('--color-primary', fetchedTheme.primaryColor || '#25D366');
          document.documentElement.style.setProperty('--color-secondary', fetchedTheme.secondaryColor || '#1ea952');
        }).catch(e => console.warn('Theme load failed, utilizing defaults', e));

        clearTimeout(timeoutId);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setIsLoading(false);
      }
    };

    init();

    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          navigate('LOGIN', { replace: true });
        } else if (event === 'SIGNED_IN' && session) {
          const u = await AuthService.getCurrentUser();
          setUser(u);
          await loadCourses();
          // Only force-redirect to HOME if the user isn't already on a real
          // in-app URL (e.g. they refreshed on /curso/123/aula/abc).
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            navigate('HOME', { replace: true });
          }
        }
      });
      authListener = data;
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = useCallback((view: ViewState) => {
    setSearchQuery('');
    navigate(view);
  }, [navigate]);

  const handleCourseSelect = (courseId: string) => {
    navigate({ view: 'COURSE_DETAIL', courseId });
  };

  const handleLessonSelect = (lessonId: string) => {
    if (!route.courseId) return;
    navigate({ view: 'PLAYER', courseId: route.courseId, lessonId });
  };

  const handleLogin = async () => {
    const u = await AuthService.getCurrentUser();
    if (u) {
      setUser(u);
      await loadCourses();
      navigate('HOME', { replace: true });
    }
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setUser(null);
    navigate('LOGIN', { replace: true });
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-10 h-10 text-brand-primary" />
      </div>
    );
  }

  // If not logged in, show login regardless of URL.
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Authenticated user still on /login: bounce them to home.
  if (route.view === 'LOGIN') {
    window.history.replaceState({}, '', buildPath({ view: 'HOME' }));
  }

  const renderContent = () => {
    switch (route.view) {
      case 'LOGIN':
      case 'HOME':
        return <HomeView courses={courses} onCourseClick={handleCourseSelect} searchQuery={searchQuery} />;

      case 'COURSE_DETAIL': {
        if (!route.courseId) return <div className="p-8 text-white">Curso não informado.</div>;
        const course = getCourseById(courses, route.courseId);
        if (!course) return <div className="p-8 text-white">Curso não encontrado ou carregando...</div>;
        return (
          <CourseDetailView
            course={course}
            onBack={() => navigate('HOME')}
            onLessonSelect={handleLessonSelect}
          />
        );
      }

      case 'PLAYER': {
        if (!route.courseId || !route.lessonId) return <div className="p-8 text-white">Aula não informada.</div>;
        const playerCourse = getCourseById(courses, route.courseId);
        if (!playerCourse) return <div className="p-8 text-white">Curso não encontrado</div>;
        return (
          <PlayerView
            course={playerCourse}
            lessonId={route.lessonId}
            onBack={() => navigate({ view: 'COURSE_DETAIL', courseId: route.courseId })}
            onLessonChange={(lessonId) =>
              navigate({ view: 'PLAYER', courseId: route.courseId, lessonId })
            }
            user={user}
          />
        );
      }

      case 'BUILDER':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <Builder /> : <AccessDenied />;

      case 'ADMIN_DASHBOARD':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <Analytics /> : <AccessDenied />;

      case 'MODERATION':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <ModerationView /> : <AccessDenied />;

      case 'INTEGRATIONS':
        return user.role === UserRole.ADMIN ? <IntegrationsView /> : <AccessDenied />;

      case 'USERS':
        return user.role === UserRole.ADMIN ? <UserPanel /> : <AccessDenied />;

      case 'MY_PROFILE':
        return <UserProfile user={user} onUpdate={handleUpdateUser} />;

      case 'STORAGE_TEST':
        return user.role === UserRole.ADMIN ? <StorageTest /> : <AccessDenied />;

      default:
        return <div className="p-8 text-white">404: View not found</div>;
    }
  };

  return (
    <Layout
      user={user}
      currentView={route.view}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      theme={theme}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
};

const AccessDenied: React.FC = () => (
  <div className="p-8 text-white">
    <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
    <p className="text-gray-400 text-sm">Você não tem permissão para acessar esta página.</p>
  </div>
);

export default App;
