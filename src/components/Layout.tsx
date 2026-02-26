import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Users, MessageSquare, Settings, 
  LogOut, Bell, Bot, Menu, X, Activity
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user?.settings) {
      document.body.classList.toggle('light-mode', !user.settings.darkMode);
      document.body.classList.toggle('high-contrast', !!user.settings.highContrast);
    }
  }, [user?.settings]);

  const navItems = user?.role === 'doctor' ? [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Users, label: t('patients'), path: '/patients' },
    { icon: MessageSquare, label: t('messages'), path: '/messages' },
    { icon: Bot, label: t('chatbot'), path: '/chatbot' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ] : [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Activity, label: t('fitness'), path: '/fitness' },
    { icon: Activity, label: t('meditation'), path: '/meditation' },
    { icon: MessageSquare, label: t('messages'), path: '/messages' },
    { icon: Bot, label: t('chatbot'), path: '/chatbot' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 sidebar-dark p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="p-2 bg-neon-blue/20 rounded-xl">
            <Activity className="w-6 h-6 text-neon-blue" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">
            Cardio<span className="text-neon-blue">AI</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                location.pathname === item.path 
                  ? 'bg-neon-blue text-black font-bold shadow-[0_0_20px_rgba(0,242,255,0.2)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-black' : 'text-white/40 group-hover:text-white'}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center font-bold text-black">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/10 glass-dark z-20">
          <div className="lg:hidden flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-white/60">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-display font-bold">CardioAI</h1>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-lg font-bold text-white/80">
              {navItems.find(i => i.path === location.pathname)?.label || t('dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {user?.settings?.notifications && (
              <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]"></span>
              </button>
            )}
            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden lg:block"></div>
            <div className="hidden lg:flex items-center gap-3">
              <p className="text-sm font-medium text-white/60">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-[#050505] border-r border-white/10 z-50 p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-neon-blue" />
                  <h1 className="text-xl font-display font-bold">CardioAI</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/60">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      location.pathname === item.path ? 'bg-neon-blue text-black font-bold' : 'text-white/60'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
