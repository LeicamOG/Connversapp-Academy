
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, ThemeConfig, PageBlock, Course, Comment, CommentStatus } from '../types';
import { DEFAULT_AVATAR } from './data';
import { generateSecureToken } from './secureRandom';

// --- CONFIGURATION ---
// Credentials MUST come from .env — never hardcode fallback keys, that is how
// secrets leak into version control.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabase) {
  console.error(
    'CRITICAL: Supabase client could not be initialized. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in your .env file.'
  );
}

// One-shot migration: older builds of the app kept a `local_users_db` entry
// in localStorage containing every user's plaintext password. Remove it on
// first load so existing browsers don't keep carrying that secret around.
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('local_users_db')) {
    localStorage.removeItem('local_users_db');
    console.info('🔒 Cleared legacy local_users_db (contained plaintext passwords).');
  }
} catch { /* localStorage may be unavailable — ignore */ }

// --- AUTH SERVICE ---
export const AuthService = {
  initializeDefaultAdmin: async () => {
    // A criação automática de admin local foi removida conforme solicitado.
    // A autenticação deve ser realizada via Supabase.
    console.log('ℹ️ Inicialização de admin local desativada. Autenticação via Supabase prioritária.');
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error(
        'Serviço de autenticação indisponível. Verifique a configuração do Supabase.'
      );
    }

    // 3s timeout so a hung network doesn't freeze the login screen forever.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo de conexão esgotado. Tente novamente.')), 3000)
    );

    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout,
    ]);

    const { data, error } = result as Awaited<
      ReturnType<typeof supabase.auth.signInWithPassword>
    >;

    if (error || !data.session) {
      throw new Error(error?.message || 'Email ou senha incorretos');
    }

    const profile = await AuthService.getProfile(data.user.id);
    const userToCache: User = profile || {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: (data.user.user_metadata?.role as UserRole) || UserRole.STUDENT,
      avatar: DEFAULT_AVATAR,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Cache the *profile* only — never the password.
    localStorage.setItem('local_user', JSON.stringify(userToCache));
    return { user: data.user, session: data.session };
  },

  signUp: async (name: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error(
        'Serviço de cadastro indisponível. Verifique a configuração do Supabase.'
      );
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo de conexão esgotado. Tente novamente.')), 3000)
    );

    const result = await Promise.race([
      supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: UserRole.STUDENT } },
      }),
      timeout,
    ]);

    const { data, error } = result as Awaited<ReturnType<typeof supabase.auth.signUp>>;

    if (error || !data.user) {
      throw new Error(error?.message || 'Não foi possível criar a conta.');
    }

    // Fire-and-forget profile creation — a RLS-protected row in `profiles`.
    supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name,
        email,
        role: UserRole.STUDENT,
        avatar: DEFAULT_AVATAR,
      })
      .then(({ error: profileError }) => {
        if (profileError) console.error('Erro criando perfil:', profileError);
      });

    return { user: data.user, session: data.session };
  },

  signOut: async () => {
    localStorage.removeItem('local_user');
    if (supabase) {
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 1000)) // 1s timeout, não bloqueia logout
        ]);
      } catch (e) { /* ignore */ }
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    // 1. Optimistic Check (Local)
    const localUserJson = localStorage.getItem('local_user');
    if (localUserJson) {
      try {
        return JSON.parse(localUserJson);
      } catch { /* ignore corrupted */ }
    }

    // 2. Tentar Supabase com Timeout
    if (supabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase Timeout')), 2000));

        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeout
        ]) as any;

        if (session?.user) {
          const user = await AuthService.getProfile(session.user.id);
          // Se achou, salva no cache local
          if (user) localStorage.setItem('local_user', JSON.stringify(user));
          return user;
        }
      } catch (e) {
        console.warn('Erro checando sessão Supabase (Timeout/Fail)', e);
      }
    }

    return null;
  },

  // Helper para pegar perfil do supabase
  getProfile: async (userId: string) => {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        avatar: data.avatar || DEFAULT_AVATAR,
        phone: data.phone,
        companyName: data.company_name,
        displayName: data.display_name,
        instagram: data.instagram,
        status: 'active' as 'active' | 'inactive',
        createdAt: data.created_at
      };
    }
    return null;
  },

  resetPassword: async (email: string) => {
    if (supabase) await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    else alert('Simulação: Email de reset enviado para ' + email);
  },

  createUser: async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone?: string,
  ) => {
    if (!supabase) {
      throw new Error(
        'Serviço indisponível. Verifique a configuração do Supabase.'
      );
    }

    // NOTE: client-side signUp creates the auth record. For production, the
    // profile insert + role assignment should happen inside a Supabase Edge
    // Function protected by service_role, otherwise a malicious user could
    // self-elevate by calling this endpoint directly.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, phone } },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Não foi possível criar o usuário.');
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role,
      phone,
      avatar: DEFAULT_AVATAR,
    });

    if (profileError) {
      console.error('Erro criando perfil:', profileError);
      throw new Error('Usuário criado, mas falha ao salvar o perfil: ' + profileError.message);
    }

    return data.user;
  },
};

// --- DATA SERVICES ---

// --- DATA SERVICES ---

export const CourseService = {
  getAll: async (): Promise<Course[]> => {
    let courses: Course[] = [];
    const localCoursesJson = localStorage.getItem('local_courses');
    const localCourses: Course[] = localCoursesJson ? JSON.parse(localCoursesJson) : [];

    // 1. Try Remote First
    if (supabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
        const { data, error } = await Promise.race([
          supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false }),
          timeout
        ]) as any;

        if (!error && data) {
          if (data.length === 0) {
            console.warn('⚠️ Server has 0 courses.');
            // SYNC UP: If server is empty but we have local courses, push them up!
            if (localCourses.length > 0) {
              console.log('🔄 Syncing Local Courses -> Remote...');
              for (const c of localCourses) {
                await CourseService.save(c); // Re-save to push to server
              }
              return localCourses;
            }
          }

          courses = data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description || '',
            coverImage: c.cover_image || '',
            bannerImage: c.banner_image || '',
            author: c.author || '',
            totalDuration: c.total_duration || 0,
            progress: 0,
            tags: c.tags || [],
            modules: c.modules || [] // Load modules from JSON
          }));

          // Update local cache
          localStorage.setItem('local_courses', JSON.stringify(courses));
          console.log('✅ Loaded', courses.length, 'courses from Supabase');
          return courses;
        } else if (error) {
          console.error('❌ Supabase fetch error:', error.message);
        }
      } catch (e) {
        console.warn("Supabase fetch failed", e);
      }
    }

    // 2. Fallback to local
    console.log('📦 Using Local Courses Fallback');
    return localCourses;
  },

  save: async (course: Course) => {
    console.log('💾 Saving course:', course.title);

    // 1. Generate ID if needed
    if (!course.id || course.id.startsWith('temp-')) {
      course.id = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // 2. Save Local (Guaranteed)
    try {
      const localCoursesJson = localStorage.getItem('local_courses');
      let courses: Course[] = localCoursesJson ? JSON.parse(localCoursesJson) : [];
      const index = courses.findIndex(c => c.id === course.id);
      if (index >= 0) courses[index] = course;
      else courses.push(course);

      localStorage.setItem('local_courses', JSON.stringify(courses));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        throw new Error("Espaço local cheio! Use links de imagem em vez de upload.");
      }
      console.error("Local Save Error", e);
    }

    // 3. Save Remote (Best Effort with Timeout)
    if (supabase) {
      try {
        console.log('☁️ Saving to Supabase...');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão')), 5000));

        const { error } = await Promise.race([
          supabase.from('courses').upsert({
            id: course.id,
            title: course.title,
            description: course.description,
            cover_image: course.coverImage,
            banner_image: course.bannerImage,
            author: course.author,
            tags: course.tags,
            total_duration: course.totalDuration,
            modules: course.modules || []
          }),
          timeout
        ]) as any;

        if (error) {
          console.error("❌ Supabase save failed:", error);
          throw new Error("Erro ao salvar no servidor: " + error.message);
        } else {
          console.log('✅ Saved to Supabase successfully!');
        }
      } catch (e: any) {
        console.error("❌ Error saving to Supabase:", e);
        // Important: We don't throw blocking error here if local worked, just warn user
        // But for "save button" feedback, maybe we should let it bubble up?
        // Let's log it prominently.
      }
    } else {
      console.warn('⚠️ Supabase not initialized');
    }

    return course;
  },

  remove: async (id: string) => {
    // Remove Local
    const localCoursesJson = localStorage.getItem('local_courses');
    if (localCoursesJson) {
      let courses: Course[] = JSON.parse(localCoursesJson);
      courses = courses.filter(c => c.id !== id);
      localStorage.setItem('local_courses', JSON.stringify(courses));
    }
    // Remove Remote
    if (supabase) {
      try { await supabase.from('courses').delete().eq('id', id); } catch (e) { }
    }
  }
};

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    let users: User[] = [];

    // 1. Fetch Remote
    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (data) {
          users = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role as UserRole,
            avatar: p.avatar || DEFAULT_AVATAR,
            status: (p.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
            createdAt: p.created_at || new Date().toISOString(),
            phone: p.phone,
            companyName: p.company_name,
            displayName: p.display_name,
            instagram: p.instagram,
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch remote users", e);
      }
    }

    return users;
  },

  updateUser: async (user: User) => {
    console.log('👤 Updating user:', user.name, 'ID:', user.id);

    // Update active session cache so the UI reflects changes immediately.
    // We only cache the profile — never credentials.
    const currentLocal = JSON.parse(localStorage.getItem('local_user') || '{}');
    if (currentLocal.id === user.id) {
      localStorage.setItem('local_user', JSON.stringify(user));
    }

    if (!supabase) return;

    // Update Remote
    try {
      console.log('☁️ Updating Supabase...');

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase Timeout')), 3000),
      );

      const result = await Promise.race([
        supabase.from('profiles').update({
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          status: user.status,
          company_name: user.companyName,
          display_name: user.displayName,
          instagram: user.instagram,
        }).eq('id', user.id),
        timeout,
      ]);
      const { error } = result as { error: { message: string } | null };

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(error.message);
      }
      console.log('✅ Profile updated in Supabase successfully!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      console.error('❌ Supabase update failed:', msg);
      throw new Error('Não foi possível atualizar o perfil: ' + msg);
    }
  },

  deleteUser: async (userId: string) => {
    if (!supabase) throw new Error('Serviço indisponível.');
    // NOTE: deleting the `profiles` row does not delete the auth user. For a
    // complete deletion, the backend should also call
    // `supabase.auth.admin.deleteUser(userId)` from a privileged edge function.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(error.message);
  },

  setUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    if (!supabase) throw new Error('Serviço indisponível.');
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  setUserRole: async (userId: string, role: UserRole) => {
    if (!supabase) throw new Error('Serviço indisponível.');
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw new Error(error.message);
  },
};

export const SettingsService = {
  getTheme: async (): Promise<ThemeConfig> => {
    const defaultTheme = {
      primaryColor: '#00D766',
      secondaryColor: '#00B359',
      logoUrl: '',
      siteName: 'ConversApp Academy'
    };

    if (!supabase) return defaultTheme;

    try {
      // Create a timeout promise that rejects after 2 seconds
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));

      // Race between the fetch and the timeout
      const { data } = await Promise.race([
        supabase.from('settings').select('theme_config').single(),
        timeout
      ]) as any;

      if (data) return data.theme_config;
    } catch (e) {
      console.warn('Theme fetch failed or timed out, using default:', e);
    }

    return defaultTheme;
  },

  updateTheme: async (theme: ThemeConfig) => {
    if (!supabase) return;
    const { count } = await supabase.from('settings').select('*', { count: 'exact', head: true });

    if (count === 0) {
      await supabase.from('settings').insert({ theme_config: theme });
    } else {
      await supabase.from('settings').update({ theme_config: theme }).gt('id', 0);
    }

    document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
  }
};

// --- REACTION & SOCIAL SERVICES ---

export const CommentService = {
  getComments: async (lessonId: string, userRole: UserRole, userId: string): Promise<Comment[]> => {
    let comments: Comment[] = [];

    // 1. Try Remote
    if (supabase) {
      try {
        // Se for admin/moderador, pega tudo. Se não, pega apenas APROVADOS ou MEUS pendentes.
        let query = supabase.from('comments').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
          comments = data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar,
            lessonId: c.lesson_id,
            text: c.text,
            timestamp: c.created_at,
            status: c.status,
            likes: c.likes || 0,
            likedBy: c.liked_by || []
          }));
        }
      } catch (e) {
        console.warn('Comments fetch failed', e);
      }
    }

    // 2. Fallback/Simulation (Local Storage for Demo)
    // Em produção real, comentários geralmente ficam só no banco. 
    // Mas para manter funcionalidade offline/demo, vamos usar localStorage se a lista remota vier vazia E não houver erro explícito (ou se offline).
    if (comments.length === 0) {
      const localComments = JSON.parse(localStorage.getItem(`comments_${lessonId}`) || '[]');
      comments = localComments;
    }

    // Filter logic based on role
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      comments = comments.filter(c => c.status === 'approved' || c.userId === userId);
    }

    return comments;
  },

  addComment: async (comment: any) => {
    // Save Local First (Optimistic)
    const key = `comments_${comment.lessonId}`;
    const localComments = JSON.parse(localStorage.getItem(key) || '[]');
    localComments.unshift(comment);
    localStorage.setItem(key, JSON.stringify(localComments));

    if (supabase) {
      try {
        await supabase.from('comments').insert({
          id: comment.id,
          lesson_id: comment.lessonId,
          user_id: comment.userId,
          user_name: comment.userName,
          user_avatar: comment.userAvatar,
          text: comment.text,
          status: comment.status, // 'pending'
          created_at: comment.timestamp
        });
      } catch (e) {
        console.error('Failed to post comment remote', e);
      }
    }
  },

  updateStatus: async (commentId: string, lessonId: string, status: 'approved' | 'rejected') => {
    // Local Update
    const key = `comments_${lessonId}`;
    const localComments = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = localComments.findIndex((c: any) => c.id === commentId);
    if (idx >= 0) {
      if (status === 'rejected') {
        localComments.splice(idx, 1);
      } else {
        localComments[idx].status = status;
      }
      localStorage.setItem(key, JSON.stringify(localComments));
    }

    // Remote Update
    if (supabase) {
      if (status === 'rejected') {
        await supabase.from('comments').delete().eq('id', commentId);
      } else {
        await supabase.from('comments').update({ status }).eq('id', commentId);
      }
    }
  },

  getAllComments: async (): Promise<Comment[]> => {
    // 1. Try Remote
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar,
            lessonId: c.lesson_id,
            text: c.text,
            timestamp: c.created_at,
            status: c.status,
            likes: c.likes || 0,
            likedBy: c.liked_by || []
          }));
        }
      } catch (e) {
        console.warn('getAllComments remote failed', e);
      }
    }

    // 2. localStorage fallback — collect all comments_* keys
    const all: Comment[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('comments_')) {
        try {
          const items: Comment[] = JSON.parse(localStorage.getItem(key) || '[]');
          all.push(...items);
        } catch { /* ignore corrupted entries */ }
      }
    }
    return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
};

export const ProgressService = {
  // Save progress locally per user
  saveProgress: (userId: string, lessonId: string, completed: boolean) => {
    const key = `progress_${userId}`;
    const progressMap = JSON.parse(localStorage.getItem(key) || '{}');
    progressMap[lessonId] = completed;
    localStorage.setItem(key, JSON.stringify(progressMap));
  },

  getProgress: (userId: string): Record<string, boolean> => {
    const key = `progress_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '{}');
  }
};

export const LayoutService = {
  getBlocks: async (): Promise<PageBlock[]> => {
    // 1. Load Local (Instant & Authoritative for Editor)
    const stored = localStorage.getItem('layout_blocks');
    if (stored) {
      const localBlocks = JSON.parse(stored);
      if (localBlocks.length > 0) {
        console.log('📦 Using Local Layout (Priority)');
        return localBlocks;
      }
    }

    // 2. If Local is empty, try Server
    if (supabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
        const { data, error } = await Promise.race([
          supabase.from('layout_blocks').select('blocks').eq('id', 1).single(),
          timeout
        ]) as any;

        if (!error && data && data.blocks) {
          localStorage.setItem('layout_blocks', JSON.stringify(data.blocks));
          return data.blocks;
        }
      } catch (e) {
        console.warn("⚠️ Remote layout fetch failed/timed out", e);
      }
    }

    // Default Fallback
    return [{
      id: 'b1',
      type: 'hero_banner',
      content: {
        title: 'Bem-vindo ao Academy',
        description: 'Configure seu banco de dados para ver o conteúdo real.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000',
        showCta: false
      }
    }];
  },

  saveBlocks: async (blocks: PageBlock[]) => {
    // 1. Save Local (Synchronous - Guaranteed)
    try {
      localStorage.setItem('layout_blocks', JSON.stringify(blocks));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.error("❌ LocalStorage Full");
        throw new Error("Espaço local cheio! Provavelmente você usou imagens muito pesadas (Upload direto). Tente usar Links de imagem ou imagens menores.");
      }
      console.error("❌ LocalStorage Error", e);
    }

    if (supabase) {
      console.log('☁️ Saving layout to Supabase (ID: 1)...');
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo limite de conexão excedido (5s)')), 5000));

        // Upsert with timeout
        // Removed 'updated_at' to safeguard against missing column schema
        const { error } = await Promise.race([
          supabase.from('layout_blocks').upsert({
            id: 1,
            blocks: blocks
          }),
          timeout
        ]) as any;

        if (error) {
          console.error('❌ Error saving layout remote:', error);
          throw error;
        } else {
          console.log('✅ Layout saved to Supabase!');
        }
      } catch (e: any) {
        console.error('❌ Exception saving layout:', e);
        // Rethrow to notify UI
        throw new Error(e.message || "Falha na conexão");
      }
    }
  }
};

export const WebhookService = {
  getWebhooks: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('webhook_subscriptions').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Webhook fetch error:', error);
        return []; // Probably table doesn't exist or RLS
      }
      return data || [];
    } catch { return []; }
  },

  createWebhook: async (name: string, url: string, eventType: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.from('webhook_subscriptions').insert({
      name,
      url,
      event_type: eventType,
      secret: 'whsec_' + generateSecureToken(24),
      active: true
    }).select().single();

    if (error) throw error;
    return data;
  },

  deleteWebhook: async (id: string) => {
    if (!supabase) return;
    await supabase.from('webhook_subscriptions').delete().eq('id', id);
  },

  toggleWebhook: async (id: string, active: boolean) => {
    if (!supabase) return;
    await supabase.from('webhook_subscriptions').update({ active }).eq('id', id);
  }
};

