import React, { useState, useEffect } from 'react';
import { User } from './types.ts';
import { Auth } from './components/Auth.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Mic2, LogOut, Coins, Crown, ShieldAlert } from 'lucide-react';
import { api } from './services/api.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  // Seed admin user and load session on mount
  useEffect(() => {
    api.initAdmin().catch(console.error);

    const session = localStorage.getItem('tts_current_session');
    if (session) {
      api.getUser(session).then(user => {
        if (user) setCurrentUser(user);
      }).catch(console.error);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tts_current_session', user.username);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tts_current_session');
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    // Update in Google Cloud (or fallback)
    api.updateUser(updatedUser.username, updatedUser).catch(console.error);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
              <Mic2 className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">pnthr</span>
          </div>

          <div className="flex items-center gap-4">
            {currentUser.username === 'admin' && (
              <button
                onClick={() => setCurrentView(currentView === 'admin' ? 'dashboard' : 'admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'admin' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                {currentView === 'admin' ? 'Exit Admin' : 'Admin Panel'}
              </button>
            )}

            {/* Credits Display */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-full px-3 py-1.5">
              {currentUser.isSubscribed ? (
                <>
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">Premium</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-gray-300">
                    {currentUser.credits} <span className="text-gray-500">credits</span>
                  </span>
                </>
              )}
            </div>

            {!currentUser.isSubscribed && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
              >
                Upgrade
              </button>
            )}

            <div className="h-6 w-px bg-gray-800 mx-1"></div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden md:block">
                {currentUser.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'admin' ? (
          <AdminPanel />
        ) : (
          <Dashboard 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onOpenPayment={() => setIsPaymentModalOpen(true)}
          />
        )}
      </main>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
    </div>
  );
};

export default App;
