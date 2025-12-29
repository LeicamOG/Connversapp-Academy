
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { HomeView, CourseDetailView, PlayerView, Builder, Analytics, LoginView, UserPanel, UserProfile, ModerationView, IntegrationsView } from './components/Views';
import StorageTest from './components/StorageTest';
import { getCourseById } from './services/data';
import { SettingsService, AuthService, CourseService, supabase } from './services/supabase';
import { ViewState, UserRole, ThemeConfig, User, Course } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>({ primaryColor: '', secondaryColor: '', logoUrl: '', siteName: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Initialization timeout - proceeding to login');
          setIsLoading(false);
          setCurrentView('LOGIN');
        }, 3000); // 3 second timeout

        // 1. Session (Critical - Prioritized)
        await AuthService.initializeDefaultAdmin().catch(e => console.warn('Admin init warning:', e)); // Non-blocking
        const currentUser = await AuthService.getCurrentUser();

        let view: ViewState = 'LOGIN';
        if (currentUser) {
          setUser(currentUser);
          view = 'HOME';
          // Start background loading of courses
          loadCourses().catch(e => console.error('Bg course load error:', e));
        }

        // 2. Theme (Non-critical)
        SettingsService.getTheme().then(fetchedTheme => {
          setTheme(fetchedTheme);
          document.documentElement.style.setProperty('--color-primary', fetchedTheme.primaryColor || '#25D366');
          document.documentElement.style.setProperty('--color-secondary', fetchedTheme.secondaryColor || '#1ea952');
        }).catch(e => console.warn('Theme load failed, utilizing defaults', e));

        clearTimeout(timeoutId);
        setCurrentView(view);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setIsLoading(false);
        setCurrentView('LOGIN');
      }
    };

    init();

    // Listener for auth changes
    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentView('LOGIN');
        } else if (event === 'SIGNED_IN' && session) {
          const u = await AuthService.getCurrentUser();
          setUser(u);
          setCurrentView('HOME');
          await loadCourses();
        }
      });
      authListener = data;
    }

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const loadCourses = async () => {
    const fetchedCourses = await CourseService.getAll();
    setCourses(fetchedCourses);
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleCourseSelect = (courseId: string) => {
    setActiveCourseId(courseId);
    handleNavigate('COURSE_DETAIL');
  };

  const handleLessonSelect = (lessonId: string) => {
    setActiveLessonId(lessonId);
    handleNavigate('PLAYER');
  };

  const handleLogin = async () => {
    const u = await AuthService.getCurrentUser();
    if (u) {
      setUser(u);
      setCurrentView('HOME');
      await loadCourses();
    }
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setUser(null);
    setCurrentView('LOGIN');
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

  // If not logged in and not loading, show login
  if (!user || currentView === 'LOGIN') {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return <HomeView courses={courses} onCourseClick={handleCourseSelect} searchQuery={searchQuery} />;

      case 'COURSE_DETAIL':
        if (!activeCourseId) return <div>Course not selected</div>;
        const course = getCourseById(courses, activeCourseId);
        if (!course) return <div className="p-8 text-white">Curso não encontrado ou carregando...</div>;
        return <CourseDetailView course={course} onBack={() => handleNavigate('HOME')} onLessonSelect={handleLessonSelect} />;

      case 'PLAYER':
        if (!activeCourseId || !activeLessonId) return <div>Error loading lesson</div>;
        const playerCourse = getCourseById(courses, activeCourseId);
        if (!playerCourse) return <div className="p-8 text-white">Curso não encontrado</div>;
        return <PlayerView course={playerCourse} lessonId={activeLessonId} onBack={() => handleNavigate('COURSE_DETAIL')} onLessonChange={setActiveLessonId} user={user} />;

      case 'BUILDER':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <Builder /> : <div>Acesso negado.</div>;

      case 'ADMIN_DASHBOARD':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <Analytics /> : <div>Acesso negado.</div>;

      case 'MODERATION':
        return user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR ? <ModerationView /> : <div>Acesso negado.</div>;

      case 'INTEGRATIONS':
        return user.role === UserRole.ADMIN ? <IntegrationsView /> : <div>Acesso negado.</div>;

      case 'USERS':
        return user.role === UserRole.ADMIN ? <UserPanel /> : <div>Acesso negado.</div>;

      case 'MY_PROFILE':
        return <UserProfile user={user} onUpdate={handleUpdateUser} />;

      case 'STORAGE_TEST':
        return user.role === UserRole.ADMIN ? <StorageTest /> : <div>Acesso negado.</div>;

      default:
        return <div className="p-8 text-white">404: View not found</div>;
    }
  };

  return (
    <Layout
      user={user}
      currentView={currentView}
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

export default App;
