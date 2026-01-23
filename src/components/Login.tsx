
import React, { useState } from 'react';
/* Added AlertCircle to imports */
import { ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (email && password) {
        if (password.length < 4) {
             setError("Password is too short (min 4 chars)");
             setIsLoading(false);
        } else {
             onLogin(email);
        }
      } else {
        setError("Please enter both email and password");
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
            <BrandLogo size={64} className="relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back to process<span className="text-indigo-600">OS</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          The next-gen process engine for modern teams.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                Corporate Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 sm:text-sm transition-all font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 sm:text-sm transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
                <div className="text-red-600 text-[11px] font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                    {/* Fixed: AlertCircle is now imported */}
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-md"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600">
                  Keep me signed in
                </label>
              </div>

              <div className="text-xs">
                <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">
                  Reset Password
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed tracking-widest uppercase"
              >
                {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                ) : (
                    <span className="flex items-center gap-3">Authenticate <ArrowRight size={18} /></span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50">
             <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Demo access &middot; Secure Sandbox
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
