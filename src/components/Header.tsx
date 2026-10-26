import React from 'react';
import {
  Menu, Archive, Github, ChevronDown,
  ListTodo, FileText, MessageCircle, FileSpreadsheet
} from 'lucide-react';
import { UserProfile, PushNotification } from '../types/shell';

interface HeaderProps {
  user: UserProfile;
  notifications: PushNotification[];
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onOpenGoogleTasks?: () => void;
  onOpenGoogleDocs?: () => void;
  onOpenGoogleChat?: () => void;
  onOpenGoogleForms?: () => void;
  onToggleMainMenu: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  cleanHomeMode?: boolean;
  onToggleCleanHomeMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenNotifications,
  onOpenGoogleTasks,
  onOpenGoogleDocs,
  onOpenGoogleChat,
  onOpenGoogleForms,
  onToggleMainMenu,
  isSyncing,
  onManualSync,
}) => {

  return (
    <div className="sticky top-0 z-30 select-none border-b border-white/10 bg-black/95 font-sans backdrop-blur-xl">
      <header className="flex min-h-[60px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMainMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title="Mở menu điều hướng"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-6 w-6" strokeWidth={1.8} />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="https://raw.githubusercontent.com/zskbot/ask-ocodejs/main/assets/app-icon-light-mode.png"
              alt="Ask OCode.js"
              className="h-8 w-8 shrink-0 object-contain"
              width="32"
              height="32"
            />
            <span className="truncate text-sm font-semibold tracking-tight text-zinc-100">Ask OCode.js</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {onOpenGoogleChat && (
            <button type="button" onClick={onOpenGoogleChat} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white lg:flex" title="Mở Google Chat">
              <MessageCircle className="h-4 w-4" /><span>Chat</span>
            </button>
          )}
          {onOpenGoogleForms && (
            <button type="button" onClick={onOpenGoogleForms} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white xl:flex" title="Mở Google Forms">
              <FileSpreadsheet className="h-4 w-4" /><span>Forms</span>
            </button>
          )}
          {onOpenGoogleDocs && (
            <button type="button" onClick={onOpenGoogleDocs} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white lg:flex" title="Mở Google Docs">
              <FileText className="h-4 w-4" /><span>Docs</span>
            </button>
          )}
          {onOpenGoogleTasks && (
            <button type="button" onClick={onOpenGoogleTasks} className="hidden h-9 items-center gap-2 rounded-lg px-3 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white xl:flex" title="Mở Google Tasks">
              <ListTodo className="h-4 w-4" /><span>Tasks</span>
            </button>
          )}
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50 sm:inline-flex"
            title="Kiểm tra trạng thái đồng bộ"
            aria-label="Đồng bộ"
          >
            <Archive className="h-4 w-4" />
          </button>
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-3 text-xs font-medium text-zinc-100 transition hover:border-white/40 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:px-3"
            title="Kết nối hoặc quản lý tài khoản GitHub"
            aria-label="Kết nối hoặc quản lý tài khoản GitHub"
          >
            {user.authProvider !== 'guest' && user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            <span>{user.authProvider === 'guest' ? 'Sign in' : user.username}</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      </header>
    </div>
  );
};
