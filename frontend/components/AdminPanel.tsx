import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { Search, ShieldAlert, Save, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface UserRowProps {
  username: string;
  userData: any;
  onSave: (username: string, updatedProfile: User) => Promise<void>;
}

const UserRow: React.FC<UserRowProps> = ({ username, userData, onSave }) => {
  const [credits, setCredits] = useState(userData.profile.credits);
  const [isSubscribed, setIsSubscribed] = useState(userData.profile.isSubscribed);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(username, { ...userData.profile, credits, isSubscribed });
    } catch (e) {
      console.error("Failed to save user", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="font-medium text-white text-lg">{username}</div>
        <div className="text-xs text-gray-500 font-mono mt-1">PWD: {userData.password}</div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Credits:</label>
          <input
            type="number"
            value={credits}
            onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
            className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isSubscribed}
            onChange={(e) => setIsSubscribed(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-950"
          />
          Premium Plan
        </label>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors w-24 justify-center"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then(data => {
      setUsers(data);
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to load users", err);
      setIsLoading(false);
    });
  }, []);

  const handleSaveUser = async (username: string, updatedProfile: User) => {
    await api.updateUser(username, updatedProfile);
    setUsers(prev => ({
      ...prev,
      [username]: {
        ...prev[username],
        profile: updatedProfile
      }
    }));
  };

  const filteredUsers = Object.keys(users).filter(u => 
    u.toLowerCase().includes(search.toLowerCase()) && u !== 'admin'
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Administrator Panel</h1>
          <p className="text-gray-400 text-sm">Manage user accounts and payment plans via Google Cloud</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading users from server...
            </div>
          ) : (
            <>
              {filteredUsers.map(username => (
                <UserRow 
                  key={username} 
                  username={username} 
                  userData={users[username]} 
                  onSave={handleSaveUser} 
                />
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-gray-500 py-12 border border-dashed border-gray-800 rounded-xl">
                  No users found matching "{search}".
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
