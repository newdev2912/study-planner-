import React, { useState, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Chrome, AlertCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [recentAccounts, setRecentAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('academia_recent_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const saveRecentAccount = (email: string) => {
    const updated = [email, ...recentAccounts.filter(a => a !== email)].slice(0, 3);
    setRecentAccounts(updated);
    localStorage.setItem('academia_recent_accounts', JSON.stringify(updated));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        saveRecentAccount(email);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        saveRecentAccount(email);
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email) saveRecentAccount(result.user.email);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRecentAccount = (email: string) => {
    setEmail(email);
    setIsLogin(true);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-display selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-8 shadow-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              AcademiaQuest
            </h1>
            <p className="text-slate-400 text-sm">Level up your learning journey</p>
          </div>

          {/* Recent Accounts */}
          {isLogin && recentAccounts.length > 0 && (
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-3 block">Neural Link Presets</label>
              <div className="space-y-2">
                {recentAccounts.map((accEmail) => (
                  <button
                    key={accEmail}
                    onClick={() => selectRecentAccount(accEmail)}
                    className="w-full bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all px-4 py-3 rounded-xl flex items-center gap-3 text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-100 truncate group-hover:text-blue-400 transition-colors">{accEmail.split('@')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-500 truncate">{accEmail}</p>
                    </div>
                    <LogIn className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8 border border-slate-800/50">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-all rounded-lg",
                isLogin ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-all rounded-lg",
                !isLogin ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500/50 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all text-sm"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  ref={passwordInputRef}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-blue-500/50 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>


            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50",
                isLogin 
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20" 
                  : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
              )}
            >
              {loading ? "Authenticating..." : isLogin ? "Launch Quest" : "Begin Journey"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-4 text-slate-500 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 py-3 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-slate-200">Google Account</span>
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 text-xs font-bold tracking-wide">
          By continuing, you agree to the Academic Code of Conduct.
        </p>
      </motion.div>
    </div>
  );
};
