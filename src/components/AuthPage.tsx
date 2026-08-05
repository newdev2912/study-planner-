import React, { useState, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Chrome, AlertCircle, User, Flame, Sparkles, ShieldCheck, Zap, PawPrint } from 'lucide-react';
import { cn } from '../lib/utils';

export type LoginThemeKey = 'orange' | 'red' | 'yellow' | 'green' | 'blue' | 'grey';

interface LoginThemeConfig {
  name: string;
  dotBg: string;
  gradient: string;
  border: string;
  shadow: string;
  glowBg: string;
  textColor: string;
  iconText: string;
  buttonBg: string;
}

const LOGIN_THEMES: Record<LoginThemeKey, LoginThemeConfig> = {
  orange: {
    name: 'Solar Orange (Default)',
    dotBg: 'bg-orange-500',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    border: 'border-orange-500/40',
    shadow: 'shadow-[0_0_45px_rgba(251,146,60,0.15)]',
    glowBg: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    iconText: 'text-amber-400 fill-amber-400',
    buttonBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 shadow-orange-500/20 border-orange-400/40',
  },
  red: {
    name: 'Crimson Red',
    dotBg: 'bg-red-500',
    gradient: 'from-rose-500 via-red-500 to-amber-500',
    border: 'border-red-500/40',
    shadow: 'shadow-[0_0_45px_rgba(239,68,68,0.15)]',
    glowBg: 'bg-red-500/10',
    textColor: 'text-red-400',
    iconText: 'text-red-400 fill-red-400',
    buttonBg: 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-red-500/20 border-red-400/40',
  },
  yellow: {
    name: 'Cyber Yellow',
    dotBg: 'bg-yellow-400',
    gradient: 'from-yellow-400 via-amber-500 to-orange-400',
    border: 'border-yellow-500/40',
    shadow: 'shadow-[0_0_45px_rgba(234,179,8,0.15)]',
    glowBg: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    iconText: 'text-yellow-400 fill-yellow-400',
    buttonBg: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-slate-950 shadow-yellow-500/20 border-yellow-400/40',
  },
  green: {
    name: 'Matrix Green',
    dotBg: 'bg-emerald-400',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    border: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_45px_rgba(16,185,129,0.15)]',
    glowBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    iconText: 'text-emerald-400 fill-emerald-400',
    buttonBg: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 border-emerald-400/40',
  },
  blue: {
    name: 'Cyber Blue',
    dotBg: 'bg-blue-400',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    border: 'border-blue-500/40',
    shadow: 'shadow-[0_0_45px_rgba(59,130,246,0.15)]',
    glowBg: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    iconText: 'text-blue-400 fill-blue-400',
    buttonBg: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 shadow-blue-500/20 border-blue-400/40',
  },
  grey: {
    name: 'Steel Grey',
    dotBg: 'bg-slate-300',
    gradient: 'from-slate-300 via-slate-400 to-slate-500',
    border: 'border-slate-400/40',
    shadow: 'shadow-[0_0_45px_rgba(148,163,184,0.15)]',
    glowBg: 'bg-slate-500/10',
    textColor: 'text-slate-300',
    iconText: 'text-slate-300 fill-slate-300',
    buttonBg: 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 hover:from-white hover:to-slate-300 text-slate-950 shadow-slate-500/20 border-slate-300/40',
  },
};

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [themeKey, setThemeKey] = useState<LoginThemeKey>('orange');
  const [showPawMenu, setShowPawMenu] = useState(false);

  const activeTheme = LOGIN_THEMES[themeKey];
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [recentAccounts, setRecentAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('academia_recent_accounts');
    return saved ? JSON.parse(saved) : ['student@academia.edu', 'cyber.scholar@quest.io'];
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-jakarta selection:bg-orange-500/30 p-4">
      {/* Dynamic Background Glows matching current theme */}
      <div className={cn("absolute top-1/4 left-1/4 w-[400px] h-[400px] blur-[140px] rounded-full pointer-events-none transition-all duration-500", activeTheme.glowBg)} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[370px] relative z-10"
      >
        {/* Main Card - Compact & Sleek */}
        <div className={cn(
          "bg-slate-900/85 backdrop-blur-2xl border rounded-2xl p-5 shadow-2xl relative overflow-hidden group transition-all duration-500",
          activeTheme.border,
          activeTheme.shadow
        )}>
          {/* Subtle Top Accent Line */}
          <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500", activeTheme.gradient)} />

          {/* Paw Icon Theme Picker in Top Right Corner */}
          <div className="absolute top-3 right-3 z-20">
            {showPawMenu && (
              <div className="absolute right-0 top-full mt-2 flex items-center gap-1.5 bg-slate-950/95 border border-slate-800 p-2 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">THEME:</span>
                {(Object.keys(LOGIN_THEMES) as LoginThemeKey[]).map((key) => {
                  const t = LOGIN_THEMES[key];
                  const isSelected = themeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setThemeKey(key);
                        setShowPawMenu(false);
                      }}
                      className={cn(
                        "w-4 h-4 rounded-full transition-all transform hover:scale-125 focus:outline-none",
                        t.dotBg,
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110"
                          : "opacity-70 hover:opacity-100"
                      )}
                      title={t.name}
                    />
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPawMenu(!showPawMenu)}
              className={cn(
                "p-1.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg transition-all active:scale-95 group relative cursor-pointer",
                showPawMenu && "bg-slate-800 border-slate-700"
              )}
              title="Change Accent Color Palette"
            >
              <PawPrint className={cn("w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110", activeTheme.textColor)} />
            </button>
          </div>

          {/* Header Branding */}
          <div className="text-center mb-5">
            <div className={cn(
              "inline-flex items-center justify-center p-2.5 rounded-xl mb-2.5 shadow-md border transition-all duration-500 group-hover:scale-105",
              activeTheme.glowBg,
              activeTheme.border
            )}>
              <Flame className={cn("w-6 h-6 transition-colors duration-500 drop-shadow-md", activeTheme.iconText)} />
            </div>
            
            <h1 className="text-xl font-black tracking-tight text-white font-jakarta">
              Academia<span className={cn("text-transparent bg-clip-text bg-gradient-to-r transition-all duration-500", activeTheme.gradient)}>Quest</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mt-0.5 flex items-center justify-center gap-1">
              <Sparkles className={cn("w-2.5 h-2.5", activeTheme.textColor)} />
              Level up your study workflow
            </p>
          </div>

          {/* Quick Preset Accounts */}
          {isLogin && recentAccounts.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Zap className={cn("w-2.5 h-2.5", activeTheme.textColor)} />
                  Quick Presets
                </span>
                <span className="text-[8px] font-mono text-slate-500">CLICK TO FILL</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {recentAccounts.map((accEmail) => (
                  <button
                    key={accEmail}
                    type="button"
                    onClick={() => selectRecentAccount(accEmail)}
                    className="w-full bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all p-2 rounded-lg flex items-center justify-between text-left group cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border transition-all shrink-0", activeTheme.glowBg, activeTheme.border)}>
                        <User className={cn("w-3 h-3", activeTheme.textColor)} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {accEmail}
                      </span>
                    </div>
                    <LogIn className={cn("w-3 h-3 text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5", `group-hover:${activeTheme.textColor}`)} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sign In / Sign Up Toggle */}
          <div className="flex bg-slate-950/90 p-1 rounded-xl mb-4 border border-slate-800/80 shadow-inner">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-lg cursor-pointer",
                isLogin 
                  ? activeTheme.buttonBg 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-lg cursor-pointer",
                !isLogin 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 border border-purple-400/30" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <UserPlus className="w-3 h-3" />
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-slate-100 rounded-xl pl-9 pr-3 py-2 outline-none transition-all text-xs font-medium placeholder:text-slate-600"
                  placeholder="scholar@university.edu"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  ref={passwordInputRef}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-slate-100 rounded-xl pl-9 pr-3 py-2 outline-none transition-all text-xs font-medium placeholder:text-slate-600"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Error Message Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] p-2.5 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span className="font-semibold">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-1 border",
                isLogin 
                  ? activeTheme.buttonBg 
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-purple-500/25 border-purple-400/40"
              )}
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isLogin ? "Enter Academy" : "Create Cadet Profile"}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-[8px] uppercase font-mono">
              <span className="bg-slate-900 px-2.5 text-slate-500 font-bold tracking-widest">OR CONNECT WITH</span>
            </div>
          </div>

          {/* Google SSO Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <Chrome className={cn("w-3.5 h-3.5 group-hover:scale-110 transition-transform", activeTheme.textColor)} />
            <span className="text-[11px] font-bold text-slate-200 group-hover:text-white">Google Workspace</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <p className="text-slate-500 text-[9px] font-mono uppercase tracking-wider">
            ⚡ 100% XP MULTIPLIER ACTIVE &bull; FREE SCHOLAR TIER
          </p>
        </div>
      </motion.div>
    </div>
  );
};
