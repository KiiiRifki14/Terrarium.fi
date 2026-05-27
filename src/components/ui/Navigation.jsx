'use client';
import { motion } from 'framer-motion';
import { Home, BarChart3, Sprout, Settings, LogOut, Download, Handshake } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, onLogout, onExportCsv, userEmail }) {
  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'analitik', label: 'Analitik', icon: BarChart3 },
    { id: 'budget', label: 'Budget', icon: Sprout },
    { id: 'hutang', label: 'Hutang', icon: Handshake },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation (Visible on screen < md) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-mint/60 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative py-1.5 px-2 flex flex-col items-center gap-0.5 focus:outline-none transition-colors min-w-[52px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobileIndicator"
                    className="absolute inset-0 bg-mint/60 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={18} className={isActive ? 'text-forest' : 'text-forest/40'} />
                <span className={`text-[9px] font-bold font-quicksand ${isActive ? 'text-forest' : 'text-forest/40'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation (Visible on screen >= md) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-mint/60 flex-col z-10 shadow-[2px_0_16px_rgba(45,106,79,0.04)]">
        {/* Logo Header */}
        <div className="p-6 border-b border-mint/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-fredoka text-forest font-bold">Terrarium.fi</h1>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold font-quicksand text-sm transition-all focus:outline-none ${
                  isActive ? 'text-white' : 'text-forest/60 hover:text-forest hover:bg-mint/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktopIndicator"
                    className="absolute inset-0 bg-forest rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={18} className={isActive ? 'text-white' : 'text-forest/60'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer/Account Actions */}
        <div className="p-4 border-t border-mint/40 space-y-3 shrink-0">
          {userEmail && (
            <div className="px-3 py-2 bg-mint/20 rounded-xl">
              <p className="text-[10px] text-forest/40 font-quicksand uppercase tracking-wide">Masuk sebagai</p>
              <p className="text-xs font-bold text-forest truncate font-quicksand mt-0.5" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}
          
          <button
            onClick={onExportCsv}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-mint/60 text-forest/70 hover:bg-mint/20 hover:text-forest font-bold font-quicksand text-sm transition-all"
          >
            <Download size={15} />
            <span>Unduh CSV</span>
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-terracotta hover:bg-terracotta hover:text-white font-bold font-quicksand text-sm transition-all border border-terracotta/20"
          >
            <LogOut size={15} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
