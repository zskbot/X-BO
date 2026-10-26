import React, { useEffect, useState } from 'react';
import { X, Github, Mail, ShieldCheck, AlertCircle, LoaderCircle } from 'lucide-react';
import { UserProfile } from '../types/shell';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, user }) => {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unavailable = (provider: string) => {
    setNotice(`${provider} sign-in is not connected yet. Configure the server-side OAuth callback and credentials before enabling authentication.`);
  };

  const requestMagicLink = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNotice('Enter a valid email address.');
      return;
    }
    setNotice('Magic-link delivery is not configured on the backend yet. No email has been sent.');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c] text-white shadow-2xl shadow-black/60">
        <button type="button" onClick={onClose} aria-label="Close sign in dialog" className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"><X size={18}/></button>
        <div className="px-6 pb-6 pt-8 sm:px-8">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><ShieldCheck size={22}/></div>
          <h2 id="auth-modal-title" className="text-center text-xl font-semibold tracking-tight">Welcome to OCode.js</h2>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-5 text-zinc-400">Sign in to manage your projects and provider settings.</p>
          <div className="mt-6 space-y-2.5">
            <button type="button" onClick={() => unavailable('GitHub OAuth')} className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"><Github size={18}/> Continue with GitHub</button>
            <button type="button" onClick={() => unavailable('Google OAuth')} className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"><span className="text-base font-bold">G</span> Continue with Google</button>
          </div>
          <div className="my-5 flex items-center gap-3 text-[11px] text-zinc-500"><span className="h-px flex-1 bg-white/10"/><span>or continue with email</span><span className="h-px flex-1 bg-white/10"/></div>
          <form onSubmit={requestMagicLink} className="space-y-2.5">
            <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300">Email address</label>
            <input id="auth-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30 focus:ring-2 focus:ring-white/10"/>
            <button type="submit" className="h-11 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><Mail size={16} className="mr-2 inline-block"/> Send magic link</button>
          </form>
          {notice && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100"><AlertCircle size={16} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}
          <p className="mt-5 text-center text-[11px] leading-5 text-zinc-500">Current local profile: <span className="text-zinc-300">{user.username}</span>. Sign-in methods remain unavailable until server authentication is configured.</p>
          <p className="mt-4 text-center text-[10px] leading-4 text-zinc-600">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </section>
    </div>
  );
};
