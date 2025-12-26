
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, ThemeConfig, PageBlock, Course } from '../types';
import { DEFAULT_AVATAR } from './data';

// --- CONFIGURATION ---
// Fallback to provided keys if environment variables are missing
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.conversapp.app.br';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0._Lg9Cay-21cEQi56tidqiOkBhzjQ6kePgSRbcQfhvO8';

// Safe initialization
export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

if (!supabase) {
  console.error("CRITICAL: Supabase client could not be initialized.");
}

// --- AUTH SERVICE ---
export const AuthService = {
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUp: async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    
    // 1. Sign Up Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: UserRole.STUDENT }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Falha no cadastro.");

    // 2. Create Profile (Role: STUDENT)
    // Only attempt insertion if we have a session (auto-login active) or if policies allow.
    // Otherwise, we rely on triggers or the user logging in later.
    if (data.session) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name,
          email,
          role: UserRole.STUDENT,
          avatar: DEFAULT_AVATAR
        });

        if (profileError) {
            if (!profileError.message.includes('duplicate')) {
                console.error("Erro ao criar perfil:", profileError);
            }
        }
    }

    return { user: data.user, session: data.session };
  },

  resetPassword: async (email: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Fetch profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
        // Fallback if profile doesn't exist yet but auth does
        return {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Usuário',
            email: session.user.email || '',
            role: session.user.user_metadata?.role as UserRole || UserRole.STUDENT,
            avatar: DEFAULT_AVATAR,
            status: 'active'
        };
    }

    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatar: profile.avatar || DEFAULT_AVATAR,
        status: 'active'
      };
    }
    return null;
  },

  // Create a new user (Admin function or Special Setup)
  createUser: async (name: string, email: string, password: string, role: UserRole) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Falha ao criar usuário Auth");

    // Force insert via admin rights or similar context if backend allows, 
    // here we just try client side
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role,
      avatar: DEFAULT_AVATAR
    });

    if (profileError && !profileError.message.includes('duplicate')) {
        console.error("Erro ao criar perfil:", profileError);
    }

    return data.user;
  }
};

// --- DATA SERVICES ---

export const CourseService = {
  getAll: async (): Promise<Course[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }

    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.cover_image,
      bannerImage: c.banner_image,
      author: c.author,
      totalDuration: c.total_duration || 0,
      progress: 0,
      tags: c.tags || [],
      modules: c.modules || [] // JSONB column
    }));
  },

  save: async (course: Course) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    
    // Upsert (Insert or Update)
    const payload = {
      id: course.id.startsWith('temp-') || course.id.length < 10 ? undefined : course.id,
      title: course.title,
      description: course.description,
      cover_image: course.coverImage,
      banner_image: course.bannerImage,
      author: course.author,
      total_duration: course.totalDuration,
      tags: course.tags,
      modules: course.modules,
      published: true
    };

    if(!payload.id) delete payload.id;

    const { data, error } = await supabase
      .from('courses')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  }
};

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as UserRole,
      avatar: p.avatar || DEFAULT_AVATAR,
      status: 'active'
    }));
  },

  updateUser: async (user: User) => {
      if (!supabase) throw new Error("Supabase não configurado.");
      const { error } = await supabase.from('profiles').update({
          name: user.name,
          role: user.role,
          avatar: user.avatar
      }).eq('id', user.id);
      if(error) throw error;
  }
};

export const SettingsService = {
  getTheme: async (): Promise<ThemeConfig> => {
    if (!supabase) {
        return {
            primaryColor: '#00D766',
            secondaryColor: '#00B359',
            logoUrl: '',
            siteName: 'ConversApp Academy'
        };
    }
    const { data } = await supabase.from('settings').select('theme_config').single();
    if (data) return data.theme_config;
    
    return {
      primaryColor: '#00D766',
      secondaryColor: '#00B359',
      logoUrl: '',
      siteName: 'ConversApp Academy'
    };
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

export const LayoutService = {
  getBlocks: async (): Promise<PageBlock[]> => {
    if (!supabase) {
        const stored = localStorage.getItem('layout_blocks');
        if(stored) return JSON.parse(stored);
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
    }
    
    // In a real app you might have a 'layout' table
    const stored = localStorage.getItem('layout_blocks');
    if(stored) return JSON.parse(stored);

    return [{
        id: 'b1',
        type: 'hero_banner',
        content: {
          title: 'Bem-vindo ao Academy',
          description: 'Sua plataforma de ensino.',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000',
          showCta: true,
          ctaText: 'Ver Cursos'
        }
    }];
  },

  saveBlocks: async (blocks: PageBlock[]) => {
    localStorage.setItem('layout_blocks', JSON.stringify(blocks));
  }
};
