import React from 'react';
import {
  Menu, Archive, Share2, Github, ChevronDown, Columns, BookOpen,
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
  activeNavTab: 'chat' | 'diff' | 'logs' | 'rfc';
  onChangeNavTab: (tab: 'chat' | 'diff' | 'logs' | 'rfc') => void;
  onToggleCleanHomeMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onOpenAuth,
  onOpenNotifications,
  onOpenGoogleTasks,
  onOpenGoogleDocs,
  onOpenGoogleChat,
  onOpenGoogleForms,
  onToggleMainMenu,
  isSyncing,
  onManualSync,
  cleanHomeMode = true,
  activeNavTab,
  onChangeNavTab,
  onToggleCleanHomeMode
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const navItems = [
    { id: 'chat' as const, label: 'Chat' },
    { id: 'diff' as const, label: 'Diff' },
    { id: 'logs' as const, label: 'Nhật ký' },
    { id: 'rfc' as const, label: 'RFC Specs' }
  ];

  return (
    <div className="sticky top-0 z-30 select-none border-b border-zinc-800/80 bg-[#09090b]/95 font-sans backdrop-blur-xl">
      <header className="flex min-h-[60px] items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMainMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto sm:gap-2 sm:px-3"
            title="Mở Menu 3 Gạch"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
            <span className="hidden text-xs font-medium sm:inline">Menu</span>
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-black tracking-tight text-zinc-950">X</div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-zinc-100">X-BO</span>
                <span className="hidden text-xs text-zinc-500 sm:inline">by OCODE.js</span>
              </div>
              <p className="hidden truncate pt-1 text-[11px] text-zinc-500 sm:block">AI workspace</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {onOpenGoogleChat && (
            <button type="button" onClick={onOpenGoogleChat} className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-300 transition hover:bg-zinc-800 lg:flex" title="Mở Google Chat">
              <MessageCircle className="h-4 w-4" /><span>Chat</span>
            </button>
          )}
          {onOpenGoogleForms && (
            <button type="button" onClick={onOpenGoogleForms} className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-300 transition hover:bg-zinc-800 xl:flex" title="Mở Google Forms">
              <FileSpreadsheet className="h-4 w-4" /><span>Forms</span>
            </button>
          )}
          {onOpenGoogleDocs && (
            <button type="button" onClick={onOpenGoogleDocs} className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-300 transition hover:bg-zinc-800 lg:flex" title="Mở Google Docs">
              <FileText className="h-4 w-4" /><span>Docs</span>
            </button>
          )}
          {onOpenGoogleTasks && (
            <button type="button" onClick={onOpenGoogleTasks} className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-300 transition hover:bg-zinc-800 xl:flex" title="Mở Google Tasks">
              <ListTodo className="h-4 w-4" /><span>Tasks</span>
            </button>
          )}
          <button type="button" onClick={onManualSync} disabled={isSyncing} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50 sm:flex" title="Kiểm tra trạng thái đồng bộ" aria-label="Đồng bộ">
            <Archive className="h-4 w-4" />
          </button>
          <button type="button" onClick={onOpenNotifications} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-300 transition hover:bg-zinc-800" title="Thông báo" aria-label="Thông báo">
            <Share2 className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white ring-2 ring-zinc-900" />}
          </button>
          <button type="button" onClick={onOpenAuth} className="flex h-10 items-center gap-2 rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-white" title="Tài khoản GitHub">
            <Github className="h-4 w-4" /><span className="hidden sm:inline">GitHub</span><ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-800/60 px-3 py-2 sm:px-6">
        <nav aria-label="Điều hướng workspace" className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeNavTab(item.id)}
              aria-current={activeNavTab === item.id ? 'page' : undefined}
              className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors ${activeNavTab === item.id ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={onToggleCleanHomeMode}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${cleanHomeMode ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'border-zinc-600 bg-zinc-800 text-zinc-100'}`}
          title={cleanHomeMode ? 'Mở Bảng Phân Tích Song Song' : 'Đóng Bảng Phân Tích'}
          aria-label={cleanHomeMode ? 'Mở bảng phân tích' : 'Đóng bảng phân tích'}
        >
          <Columns className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
