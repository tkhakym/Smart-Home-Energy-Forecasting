import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay for polish
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        if (rememberMe) localStorage.setItem('savedUser', username);
        onLogin();
      } else {
        setError('Invalid credentials.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#020617]">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-sm">
        
        {/* LOGO AREA */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center">
            {/* Replace this ShieldCheck with your logo <img src="/logo.png" /> */}
            <ShieldCheck className="text-emerald-500" size={40} />
          </div>
        </div>

        <h1 className="text-white text-xl font-bold text-center mb-1">Smart Home System</h1>
        <p className="text-slate-500 text-xs text-center mb-6">Enter your credentials to access energy controls</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input 
              type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
            <input 
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="accent-emerald-500" />
              Remember me
            </label>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}