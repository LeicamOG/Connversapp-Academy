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

const SPRING = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

const Layout: React.FC<LayoutProps> = ({
  children, user, currentView, onNavigate, onLogout, theme, searchQuery, onSearch
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMac = typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMac]);

  const isAdminOrMod = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  const isAdmin = user.role === UserRole.ADMIN;

  const notifications = [
    { id: 1, text: "Bem-vindo à nova plataforma!", time: "2 min atrás", type: "info" },
    { id: 2, text: "Novo curso disponível: Marketing", time: "1 hora atrás", type: "success" },
    { id: 3, text: "Sua aula foi marcada como concluída", time: "1 dia atrás", type: "success" },
  ];

  const roleLabel =
    user.role === UserRole.ADMIN ? 'Admin'
    : user.role === UserRole.MODERATOR ? 'Moderador'
    : 'Membro';

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const active = currentView === view;
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => { onNavigate(view); setIsSidebarOpen(false); }}
        className={`sidebar-nav-item ${active ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
        style={isSidebarCollapsed ? { padding: '0.65rem 0' } : undefined}
        title={isSidebarCollapsed ? label : undefined}
      >
        <Icon
          className={`shrink-0 ${isSidebarCollapsed ? '' : 'mr-2.5'}`}
          style={{ width: 15, height: 15, strokeWidth: 1.8 }}
        />
        {!isSidebarCollapsed && (
          <span className="tracking-tight truncate">{label}</span>
        )}
      </motion.button>
    );
  };

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    isSidebarCollapsed ? null : (
      <div className="eyebrow-muted px-3 pt-5 pb-2.5">{children}</div>
    );

  const SIDEBAR_W = isSidebarCollapsed ? 68 : 264;

  return (
    <div className="min-h-screen w-full bg-brand-dark text-white flex font-sans relative z-10">

      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: SIDEBAR_W }}
        transition={SPRING}
        className={`sidebar-premium fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300
        `}
      >
        {/* Brand */}
        <div
          className={`px-4 pt-5 pb-4 flex items-center
            ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo bezel */}
            <div className="relative shrink-0 p-[2px] rounded-[10px] bg-white/4 border border-transparent">
              <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full" />
              <img
                src="https://i.imgur.com/vAJo2nR.png"
                alt="Conversapp"
                className="relative w-8 h-8 object-contain rounded-[8px]"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[14px] font-extrabold text-white tracking-tight">Conversapp</span>
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.22em]"
                  style={{ color: 'var(--green)' }}
                >
                  Academy
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg shrink-0
              bg-white/4 hover:bg-white/8 border border-white/[0.03] hover:border-white/[0.08]
              text-gray-500 hover:text-white transition-all duration-200"
            title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isSidebarCollapsed
              ? <ChevronRight style={{ width: 11, height: 11 }} />
              : <ChevronLeft  style={{ width: 11, height: 11 }} />
            }
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors p-1"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div className="divider-premium mx-3" />

        {/* Navigation */}
        <nav className="flex-1 px-2.5 mt-1.5 overflow-y-auto overflow-x-hidden scrollbar-subtle">
          <SectionLabel>Navegação</SectionLabel>
          <NavItem view="HOME"       icon={Home}       label="Início" />
          <NavItem view="MY_PROFILE" icon={UserIcon}   label="Meu Perfil" />

          {isAdminOrMod && (
            <>
              <SectionLabel>Gestão</SectionLabel>
              <NavItem view="ADMIN_DASHBOARD" icon={BarChart}    label="Analytics" />
              <NavItem view="MODERATION"      icon={MessageSquare} label="Comentários" />
              <NavItem view="BUILDER"         icon={LayoutIcon}  label="Construtor" />
              {isAdmin && (
                <>
                  <NavItem view="USERS"        icon={Users}   label="Usuários" />
                  <NavItem view="INTEGRATIONS" icon={Webhook} label="Integrações" />
                </>
              )}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/[0.03]">
          <button
            onClick={() => onNavigate('MY_PROFILE')}
            className={`flex items-center w-full text-left p-2.5 rounded-[14px]
              hover:bg-white/4 transition-all duration-200 group
              ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}
            `}
          >
            {/* Avatar bezel */}
            <div className="relative shrink-0 p-[2px] rounded-full bg-white/4 border border-transparent group-hover:border-green-500/20 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-green-600/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
              <img
                src={user.avatar}
                alt={user.name}
                className="relative w-9 h-9 rounded-full object-cover"
              />
              <div
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2"
                style={{ background: 'var(--green)', borderColor: 'var(--bg-0)' }}
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{user.name}</p>
                <p
                  className="text-[9px] font-mono uppercase tracking-[0.16em] truncate"
                  style={{ color: 'var(--green)' }}
                >
                  {roleLabel}
                </p>
              </div>
            )}
          </button>

          {!isSidebarCollapsed && (
            <button
              onClick={onLogout}
              className="w-full mt-1.5 flex items-center justify-center gap-1.5
                text-[10.5px] text-gray-600 hover:text-red-400 py-1.5
                transition-colors duration-200"
            >
              <LogOut style={{ width: 11, height: 11 }} />
              Encerrar sessão
            </button>
          )}
        </div>
      </motion.aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* ── HEADER ── */}
        <header className="header-premium h-14 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4">

          {/* Left: hamburger + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-white transition-colors"
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>

            {/* Search pill */}
            <div className="header-search hidden md:flex items-center px-3.5 h-9 w-full max-w-[380px]">
              <Search style={{ width: 13, height: 13 }} className="text-gray-600 mr-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Buscar cursos, módulos..."
                className="bg-transparent border-none outline-none text-[13px] text-white w-full placeholder-gray-700"
              />
              {!searchQuery && (
                <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 ml-2 rounded-md
                  text-[9px] font-mono text-gray-600 border border-white/[0.04] bg-white/[0.03] shrink-0 whitespace-nowrap">
                  {shortcutLabel}
                </kbd>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">

            {/* Mobile: profile icon */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('MY_PROFILE')}
              className="md:hidden p-2 text-gray-500 hover:text-white transition-colors"
            >
              <UserIcon style={{ width: 16, height: 16 }} />
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative w-8 h-8 flex items-center justify-center rounded-[10px] transition-all duration-200 ${
                  isNotificationsOpen
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-white/4 hover:bg-white/7 text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                <Bell style={{ width: 14, height: 14 }} />
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-[#040707]"
                  style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }}
                />
              </motion.button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute right-0 mt-2 w-76 panel-premium-raised z-50 overflow-hidden"
                      style={{ width: 300 }}
                    >
                      <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between">
                        <span className="font-bold text-white text-[13px]">Notificações</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--green)' }}>
                          {notifications.length} novas
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto scrollbar-subtle">
                        {notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 hover:bg-white/4 border-b border-white/4 last:border-0 flex gap-3 transition-colors">
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                              n.type === 'success'
                                ? 'bg-green-400 shadow-[0_0_8px_#25D366]'
                                : 'bg-blue-400'
                            }`} />
                            <div className="min-w-0">
                              <p className="text-[12.5px] text-gray-200 leading-snug">{n.text}</p>
                              <span className="text-[10px] text-gray-600 font-mono">{n.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-white/[0.03]">
                        <button
                          className="w-full text-[10px] font-bold hover:bg-white/4 py-2 rounded-lg transition-colors uppercase tracking-widest font-mono"
                          style={{ color: 'var(--green)' }}
                        >
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

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
