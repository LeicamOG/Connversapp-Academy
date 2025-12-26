
import React, { useState } from 'react';
import { 
  Home, BookOpen, Layout as LayoutIcon, 
  Menu, X, Search, Bell, LogOut, BarChart, Users, ChevronLeft, ChevronRight, User as UserIcon,
  MessageSquare, Webhook, CheckCircle, AlertCircle
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

  const isAdminOrMod = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  const isAdmin = user.role === UserRole.ADMIN;

  // Mock Notifications
  const notifications = [
      { id: 1, text: "Bem-vindo à nova plataforma!", time: "2 min atrás", type: "info" },
      { id: 2, text: "Novo curso disponível: Marketing", time: "1 hora atrás", type: "success" },
      { id: 3, text: "Sua aula foi marcada como concluída", time: "1 dia atrás", type: "success" },
  ];

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        onNavigate(view);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1 relative group
        ${currentView === view 
          ? 'bg-brand-primary/10 text-brand-primary' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }
        ${isSidebarCollapsed ? 'justify-center' : ''}
      `}
      title={isSidebarCollapsed ? label : ''}
    >
      <Icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
      {!isSidebarCollapsed && <span>{label}</span>}
      {currentView === view && (
         <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-primary rounded-r-full" />
      )}
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isSidebarCollapsed ? 90 : 280 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-brand-card border-r border-white/5 z-50 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area & Toggle */}
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden justify-center w-full my-4">
                <img 
                    src="https://i.imgur.com/FIJkEbs.png" 
                    alt="Logo" 
                    className={`h-24 w-auto object-contain transition-all ${isSidebarCollapsed ? 'scale-150' : ''}`} 
                />
          </div>
          
          {/* Desktop Toggle - Now next to logo or centered if collapsed */}
          <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             className={`hidden lg:flex p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors absolute right-2 top-24`}
           >
             {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 absolute right-4 top-6">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-4">Menu</div>}
          <NavItem view="HOME" icon={Home} label="Início" />
          <NavItem view="COURSE_DETAIL" icon={BookOpen} label="Meus Cursos" />
          
          {isAdminOrMod && (
            <>
              <div className={`mt-8 mb-4 px-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                 <div className="h-px bg-white/5"></div>
                 <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-4">Gestão</div>
              </div>
              <NavItem view="ADMIN_DASHBOARD" icon={BarChart} label="Analytics" />
              <NavItem view="MODERATION" icon={MessageSquare} label="Comentários" />
              <NavItem view="BUILDER" icon={LayoutIcon} label="Construtor" />
              
              {isAdmin && (
                  <>
                    <NavItem view="USERS" icon={Users} label="Usuários" />
                    <NavItem view="INTEGRATIONS" icon={Webhook} label="Integrações API" />
                  </>
              )}
            </>
          )}
        </nav>

        {/* User Footer - Clickable for Profile */}
        <div className="p-4 border-t border-white/5 bg-brand-card/50">
          <button 
            onClick={() => onNavigate('MY_PROFILE')}
            className={`flex items-center gap-3 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-brand-primary/20 object-cover" />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role.toLowerCase()}</p>
              </div>
            )}
          </button>
          {!isSidebarCollapsed && (
             <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400 py-1">
                <LogOut className="w-3 h-3" /> Sair
             </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-brand-dark/95 backdrop-blur-md sticky top-0 z-30 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center bg-brand-card rounded-lg px-4 py-2 w-96 border border-white/5 focus-within:border-brand-primary/50 transition-colors">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)} 
              placeholder="Pesquisar cursos, aulas..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-4 relative">
            <motion.button 
               whileTap={{ scale: 0.9 }}
               onClick={() => onNavigate('MY_PROFILE')}
               className="md:hidden p-2 text-gray-400 hover:text-white"
            >
               <UserIcon className="w-5 h-5" />
            </motion.button>
            
            {/* Notification Bell */}
            <div className="relative">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 hover:text-white relative transition-colors ${isNotificationsOpen ? 'text-white' : 'text-gray-400'}`}
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-dark"></span>
                </motion.button>

                <AnimatePresence>
                    {isNotificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-80 bg-brand-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/5 font-bold text-white text-sm">Notificações</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-4 hover:bg-white/5 border-b border-white/5 last:border-0 flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <p className="text-sm text-gray-200 leading-snug">{n.text}</p>
                                                <span className="text-[10px] text-gray-500">{n.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 text-center border-t border-white/5">
                                    <button className="text-xs text-brand-primary font-bold hover:underline">Marcar todas como lidas</button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
