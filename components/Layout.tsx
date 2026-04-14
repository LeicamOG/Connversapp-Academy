import React, { useState, useEffect, useRef } from 'react';
import {
  Home, BookOpen, Layout as LayoutIcon,
  Menu, X, Search, Bell, LogOut, BarChart, Users, ChevronLeft, ChevronRight, User as UserIcon,
  MessageSquare, Webhook
} from 'lucide-react';
import { User, UserRole, ViewState, ThemeConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  theme: ThemeConfig;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children, user, currentView, onNavigate, onLogout, theme, searchQuery, onSearch
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect OS: true = Mac, false = Windows/Linux
  const isMac = typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  // Register keyboard shortcut Ctrl/Cmd + K → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Escape → blur search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMac]);

  const isAdminOrMod = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  const isAdmin = user.role === UserRole.ADMIN;

  // Mock Notifications
  const notifications = [
    { id: 1, text: "Bem-vindo à nova plataforma!", time: "2 min atrás", type: "info" },
    { id: 2, text: "Novo curso disponível: Marketing", time: "1 hora atrás", type: "success" },
    { id: 3, text: "Sua aula foi marcada como concluída", time: "1 dia atrás", type: "success" },
  ];

  const roleLabel =
    user.role === UserRole.ADMIN ? 'Admin'
    : user.role === UserRole.MODERATOR ? 'Moderador'
    : 'Membro Premium';

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const active = currentView === view;
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { onNavigate(view); setIsSidebarOpen(false); }}
        className={`sidebar-nav-item ${active ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center !px-0' : ''}`}
        title={isSidebarCollapsed ? label : ''}
      >
        <Icon className={`w-[18px] h-[18px] ${isSidebarCollapsed ? '' : 'mr-3'}`} />
        {!isSidebarCollapsed && <span className="tracking-tight">{label}</span>}
      </motion.button>
    );
  };

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    isSidebarCollapsed ? null : (
      <div className="eyebrow-muted px-4 pt-6 pb-3">{children}</div>
    );

  return (
    <div className="h-screen w-full bg-brand-dark text-white flex font-sans relative z-10 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 84 : 280 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`sidebar-premium fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300
        `}
      >
        {/* Brand area */}
        <div className={`px-5 pt-6 pb-4 flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-6' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-brand-primary/30 blur-xl rounded-full" />
              <img
                src="https://i.imgur.com/vAJo2nR.png"
                alt="Conversapp"
                className="relative w-9 h-9 object-contain"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[15px] font-bold text-white tracking-tight">Conversapp</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-brand-primary">Academy</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/30 text-gray-400 hover:text-brand-primary transition-colors"
            title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divider-premium mx-4" />

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2 overflow-y-auto overflow-x-hidden scrollbar-subtle">
          <SectionLabel>Navegação</SectionLabel>
          <NavItem view="HOME" icon={Home} label="Início" />
          <NavItem view="MY_PROFILE" icon={UserIcon} label="Meu Perfil" />

          {isAdminOrMod && (
            <>
              <SectionLabel>Gestão</SectionLabel>
              <NavItem view="ADMIN_DASHBOARD" icon={BarChart} label="Analytics" />
              <NavItem view="MODERATION" icon={MessageSquare} label="Comentários" />
              <NavItem view="BUILDER" icon={LayoutIcon} label="Construtor" />

              {isAdmin && (
                <>
                  <NavItem view="USERS" icon={Users} label="Usuários" />
                  <NavItem view="INTEGRATIONS" icon={Webhook} label="Integrações" />
                </>
              )}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => onNavigate('MY_PROFILE')}
            className={`flex items-center gap-3 w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors group ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-premium rounded-full opacity-50 blur-md group-hover:opacity-80 transition-opacity" />
              <img
                src={user.avatar}
                alt={user.name}
                className="relative w-10 h-10 rounded-full object-cover ring-2 ring-brand-primary/30"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-primary border-2 border-brand-dark" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-primary truncate">{roleLabel}</p>
              </div>
            )}
          </button>
          {!isSidebarCollapsed && (
            <button
              onClick={onLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500 hover:text-red-400 py-1.5 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Encerrar sessão
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden">
        {/* Header */}
        <header className="header-premium h-16 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="header-search hidden md:flex items-center px-4 h-10 w-full max-w-md">
              <Search className="w-4 h-4 text-gray-500 mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Buscar cursos, módulos, aulas..."
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-600"
              />
              {!searchQuery && (
                <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 ml-3 rounded text-[10px] font-mono text-gray-500 border border-white/10 bg-white/5 shrink-0 whitespace-nowrap">
                  {shortcutLabel}
                </kbd>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('MY_PROFILE')}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <UserIcon className="w-5 h-5" />
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  isNotificationsOpen ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full ring-2 ring-brand-dark shadow-[0_0_8px_#25D366]" />
              </motion.button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-80 panel-premium-raised z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="font-bold text-white text-sm">Notificações</div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-brand-primary">{notifications.length} novas</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-subtle">
                        {notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex gap-3">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-brand-primary shadow-[0_0_8px_#25D366]' : 'bg-blue-400'}`} />
                            <div className="min-w-0">
                              <p className="text-[13px] text-gray-100 leading-snug">{n.text}</p>
                              <span className="text-[10px] text-gray-500 font-mono">{n.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-white/5">
                        <button className="w-full text-[11px] text-brand-primary font-bold hover:bg-brand-primary/5 py-2 rounded-lg transition-colors uppercase tracking-wider font-mono">
                          Marcar todas como lidas
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
