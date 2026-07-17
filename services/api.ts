import { db } from './firebase.ts';
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import { User } from '../types.ts';
import { INITIAL_CREDITS } from '../constants.ts';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  async initAdmin() {
    const adminProfile: User = { username: 'admin', credits: 999999, isSubscribed: true };
    const adminPassword = 'U7WTlGsGvSOqtFtoFSYmJrfMTYxreRrzm4hw6bVlmPE35V8VeHjeCX0p5qST5Pwu';

    if (db) {
      try {
        const adminRef = doc(db, 'users', 'admin');
        const snap = await getDoc(adminRef);
        if (!snap.exists()) {
          await setDoc(adminRef, { password: adminPassword, profile: adminProfile });
        }
      } catch (e) {
        console.error("Google Cloud init error:", e);
      }
    } else {
      const stored = JSON.parse(localStorage.getItem('tts_users') || '{}');
      if (!stored['admin']) {
        stored['admin'] = { password: adminPassword, profile: adminProfile };
        localStorage.setItem('tts_users', JSON.stringify(stored));
      }
    }
  },

  async getUser(username: string): Promise<User | null> {
    if (db) {
      const userRef = doc(db, 'users', username);
      const snap = await getDoc(userRef);
      if (snap.exists()) return snap.data().profile as User;
      return null;
    }
    const stored = JSON.parse(localStorage.getItem('tts_users') || '{}');
    return stored[username] ? stored[username].profile : null;
  },

  async login(username: string, password: string): Promise<User> {
    if (db) {
      const userRef = doc(db, 'users', username);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().password === password) {
        return snap.data().profile as User;
      }
      throw new Error('Invalid username or password.');
    }
    
    await delay(400); // Simulate network
    const stored = JSON.parse(localStorage.getItem('tts_users') || '{}');
    if (stored[username] && stored[username].password === password) {
      return stored[username].profile;
    }
    throw new Error('Invalid username or password.');
  },

  async register(username: string, password: string): Promise<User> {
    const newProfile: User = { username, credits: INITIAL_CREDITS, isSubscribed: false };
    
    if (db) {
      const userRef = doc(db, 'users', username);
      const snap = await getDoc(userRef);
      if (snap.exists()) throw new Error('Username already exists.');
      await setDoc(userRef, { password, profile: newProfile });
      return newProfile;
    }

    await delay(400); // Simulate network
    const stored = JSON.parse(localStorage.getItem('tts_users') || '{}');
    if (stored[username]) throw new Error('Username already exists.');
    stored[username] = { password, profile: newProfile };
    localStorage.setItem('tts_users', JSON.stringify(stored));
    return newProfile;
  },

  async updateUser(username: string, profile: User): Promise<void> {
    if (db) {
      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, { profile });
      return;
    }
    
    const stored = JSON.parse(localStorage.getItem('tts_users') || '{}');
    if (stored[username]) {
      stored[username].profile = profile;
      localStorage.setItem('tts_users', JSON.stringify(stored));
    }
  },

  async getUsers(): Promise<Record<string, any>> {
    if (db) {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      const users: Record<string, any> = {};
      snap.forEach(doc => {
        users[doc.id] = doc.data();
      });
      return users;
    }
    
    await delay(200); // Simulate network
    return JSON.parse(localStorage.getItem('tts_users') || '{}');
  }
};
