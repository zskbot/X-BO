import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Folder,
  FileText,
  Download,
  Plus,
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  Terminal,
  FileCode,
  ShieldCheck,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Database,
  Trash2,
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import { ProjectFile, SavedSession, WatsonMetrics, UserProfile } from '../types/shell';
import { getConfidenceTheme } from '../utils/syntaxHighlighting';

interface MainMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  sessions: SavedSession[];
  metrics: WatsonMetrics;
  user: UserProfile;
  cleanHomeMode: boolean;
  onToggleCleanHomeMode: () => void;
  onSelectFile: (file: ProjectFile) => void;
  onSelectSession: (session: SavedSession) => void;
  onExecuteCommand: (cmd: string) => void;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onExportCSV: () => void;
  onNewSession: () => void;
  onClearTerminal: () => void;
  onOpenAuth: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
  onSetConfidence?: (score: number) => void;
}

export const MainMenuDrawer: React.FC<MainMenuDrawerProps> = ({
  isOpen,
  onClose,
  files,
  sessions,
  metrics,
  user,
  cleanHomeMode,
  onToggleCleanHomeMode,
  onSelectFile,
  onSelectSession,
  onExecuteCommand,
  onExportPDF,
  onExportMarkdown,
  onExportCSV,
  onNewSession,
  onClearTerminal,
  onOpenAuth,
  onManualSync,
  isSyncing,
  onSetConfidence
}) => {
  const [activeTab, setActiveTab] = useState<'utilities' | 'files' | 'sessions' | 'system'>('utilities');
  const [activeUtilityTab, setActiveUtilityTab] = useState<'actions' | 'reports' | 'terminal'>('actions');
  const theme = getConfidenceTheme(metrics.aiConfidence);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <aside className="xbo-nav-drawer relative w-[min(88vw,360px)] max-w-none sm:w-[360px] bg-black border-r border-neutral-800 h-full flex flex-col shadow-2xl z-10 overflow-hidden text-white font-mono">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-black border-b-2 border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="https://raw.githubusercontent.com/zskbot/X-BO/main/assets/app-icon-light-mode.png" alt="OCode.js" className="h-10 w-10 rounded-xl object-contain" width="40" height="40" />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">OCode.js</h2>
              <p className="text-xs text-neutral-500 font-sans">Ask OCode.js</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white rounded-none border-2 border-neutral-700 transition-colors cursor-pointer active:scale-95"
            title="Đóng Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="xbo-infra-summary flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-zinc-100">Workspace</div>
            <div className="mt-1 text-[10px] text-zinc-500">{cleanHomeMode ? 'Clean layout enabled' : 'Studio layout enabled'}</div>
          </div>
          <button onClick={onToggleCleanHomeMode} className="xbo-mode-switch shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-200 transition hover:bg-zinc-800">
            {cleanHomeMode ? 'Enable Studio' : 'Enable Clean'}
          </button>
        </div>

        <div className="xbo-infra-nav px-3 py-3">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">Infrastructure</div>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { id: 'utilities', label: 'Overview', icon: <Zap className="h-4 w-4" /> },
              { id: 'files', label: 'Projects', icon: <Folder className="h-4 w-4" /> },
              { id: 'sessions', label: 'Deployments', icon: <Database className="h-4 w-4" /> },
              { id: 'system', label: 'Settings', icon: <Sliders className="h-4 w-4" /> }
            ] as const).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${activeTab === item.id ? 'bg-zinc-800 text-white ring-1 ring-zinc-700' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs bg-black">
          {/* TAB 1: ESSENTIAL UTILITIES */}
          {activeTab === 'utilities' && (
            <div className="space-y-4">
            <div className="xbo-nested-nav">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">Overview / Controls</div>
              <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                {([
                  { id: 'actions', label: 'Quick actions' },
                  { id: 'reports', label: 'Reports' },
                  { id: 'terminal', label: 'Terminal' }
                ] as const).map(item => (
                  <button key={item.id} onClick={() => setActiveUtilityTab(item.id)} aria-pressed={activeUtilityTab === item.id}
                    className={`min-h-9 rounded-lg px-2 text-[10px] font-medium transition ${activeUtilityTab === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

              {activeUtilityTab === 'actions' && (
                <>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Lệnh Chạy Nhanh (Quick Actions)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      onExecuteCommand('watson run-analysis --db cloudant_prod --depth full');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-700 hover:border-cyan-400 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-neutral-900 text-cyan-300 rounded-none border border-neutral-700">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300">Phân Tích Watson ML</div>
                        <div className="text-[10px] text-neutral-400 font-mono">watson run-analysis</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-300" />
                  </button>

                  <button
                    onClick={() => {
                      onExecuteCommand('watson optimize --dry-run');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-700 hover:border-cyan-400 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-neutral-900 text-cyan-300 rounded-none border border-neutral-700">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300">Tối Ưu Hóa Cụm Cloudant</div>
                        <div className="text-[10px] text-neutral-400 font-mono">watson optimize --dry-run</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-300" />
                  </button>

                  <button
                    onClick={() => {
                      onExecuteCommand('watson sync-devices --target cloudant_prod');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-700 hover:border-cyan-400 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-neutral-900 text-cyan-300 rounded-none border border-neutral-700">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300">Đồng Bộ Thiết Bị Real-time</div>
                        <div className="text-[10px] text-neutral-400 font-mono">watson sync-devices</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-300" />
                  </button>

                  <button
                    onClick={() => {
                      onExecuteCommand('watson prune --duplicates');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-700 hover:border-cyan-400 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-neutral-900 text-amber-300 rounded-none border border-neutral-700">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300">Dọn Bản Ghi Trùng Lặp</div>
                        <div className="text-[10px] text-neutral-400 font-mono">watson prune --duplicates</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-300" />
                  </button>
                </div>
              </div>

                </>
              )}
              {activeUtilityTab === 'reports' && (
                <>
              {/* Data Export Shortcuts */}
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" /> Xuất Báo Cáo & Dữ Liệu
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onExportPDF();
                      onClose();
                    }}
                    className="p-2 bg-black hover:bg-neutral-900 border-2 border-neutral-700 rounded-none text-center transition-all cursor-pointer group active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-cyan-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold block text-white">Báo Cáo PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportMarkdown();
                      onClose();
                    }}
                    className="p-2 bg-black hover:bg-neutral-900 border-2 border-neutral-700 rounded-none text-center transition-all cursor-pointer group active:scale-95"
                  >
                    <FileCode className="w-4 h-4 text-cyan-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold block text-white">Markdown</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportCSV();
                      onClose();
                    }}
                    className="p-2 bg-black hover:bg-neutral-900 border-2 border-neutral-700 rounded-none text-center transition-all cursor-pointer group active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-cyan-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold block text-white">CSV Logs</span>
                  </button>
                </div>
              </div>

                </>
              )}
              {activeUtilityTab === 'terminal' && (
                <>
              {/* Terminal Session Controls */}
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Điều Khiển Terminal
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClearTerminal();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-black hover:bg-neutral-900 border-2 border-neutral-700 rounded-none font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-300" />
                    Xóa Màn Hình
                  </button>
                  <button
                    onClick={() => {
                      onNewSession();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-cyan-300 text-black font-extrabold uppercase rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Phiên Mới
                  </button>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PROJECT FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Tệp Cấu Hình & Logs Dự Án
              </div>
              <div className="space-y-1">
                {files.map(folder => (
                  <div key={folder.id} className="space-y-1">
                    <div className="flex items-center text-cyan-300 bg-neutral-950 px-2.5 py-1.5 rounded-none border-2 border-neutral-700 font-mono text-xs font-bold">
                      <Folder className="w-4 h-4 mr-2 shrink-0 text-cyan-400" />
                      <span>{folder.name}</span>
                    </div>

                    {folder.children && (
                      <div className="pl-3 space-y-1 border-l-2 border-neutral-800 ml-3">
                        {folder.children.map(file => (
                          <button
                            key={file.id}
                            onClick={() => {
                              onSelectFile(file);
                              onClose();
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-600 text-neutral-200 hover:text-white transition-all text-left cursor-pointer active:scale-98"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="font-mono text-xs truncate font-bold">{file.name}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono font-semibold">{file.size}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Lịch Sử Phiên Chạy
                </span>
                <button
                  onClick={onNewSession}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" /> Tạo Mới
                </button>
              </div>

              <div className="space-y-2">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSession(s);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-none bg-black hover:bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-600 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        {s.name}
                      </span>
                      <span className="px-1.5 py-0.2 bg-neutral-900 text-cyan-300 rounded-none border border-neutral-700 text-[9px] font-mono font-bold">
                        {s.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono font-medium">
                      <span>{s.commandCount} lệnh</span>
                      <span>{s.timestamp}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM HEALTH & SECURITY */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Chỉ Số Watson ML & Cloudant
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black p-2.5 rounded-none border-2 border-neutral-700">
                  <div className="text-[10px] text-neutral-400 mb-0.5 font-bold">Hiệu Suất Cụm</div>
                  <div className="text-sm font-extrabold text-cyan-300 font-mono">{metrics.nodeEfficiency}%</div>
                </div>
                <div className="bg-black p-2.5 rounded-none border-2 border-neutral-700">
                  <div className="text-[10px] text-neutral-400 mb-0.5 font-bold">Độ Trễ Phản Hồi</div>
                  <div className="text-sm font-extrabold text-cyan-300 font-mono">{metrics.queryLatencyMs} ms</div>
                </div>
                <div className="bg-black p-2.5 rounded-none border-2 border-neutral-700">
                  <div className="text-[10px] text-neutral-400 mb-0.5 font-bold">Bản Ghi Xử Lý</div>
                  <div className="text-xs font-extrabold text-white font-mono">{metrics.recordsProcessed.toLocaleString()}</div>
                </div>
                <div className="bg-black p-2.5 rounded-none border-2 border-neutral-700">
                  <div className="text-[10px] text-neutral-400 mb-0.5 font-bold">Nút Hoạt Động</div>
                  <div className="text-xs font-extrabold text-cyan-300 font-mono">{metrics.activeNodes} Cluster Nodes</div>
                </div>
              </div>

              {/* AI Confidence Score Shifter */}
              <div className="p-3 bg-black rounded-none border-2 border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Watson AI Confidence</span>
                  <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-neutral-900 text-cyan-300 border border-neutral-600">
                    {(metrics.aiConfidence * 100).toFixed(0)}% ({theme.label})
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Dịch chuyển màu sắc Syntax Highlighting & độ tin cậy mô hình AI:
                </p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => onSetConfidence && onSetConfidence(0.95)}
                    className={`flex-1 py-1 px-2 rounded-none text-[10px] font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                      metrics.aiConfidence >= 0.9
                        ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold'
                        : 'bg-black border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    High 95%
                  </button>
                  <button
                    onClick={() => onSetConfidence && onSetConfidence(0.82)}
                    className={`flex-1 py-1 px-2 rounded-none text-[10px] font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                      metrics.aiConfidence >= 0.7 && metrics.aiConfidence < 0.9
                        ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold'
                        : 'bg-black border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    Med 82%
                  </button>
                  <button
                    onClick={() => onSetConfidence && onSetConfidence(0.55)}
                    className={`flex-1 py-1 px-2 rounded-none text-[10px] font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                      metrics.aiConfidence < 0.7
                        ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold'
                        : 'bg-black border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    Low 55%
                  </button>
                </div>
              </div>

              {/* Security & User Profile */}
              <div className="p-3 bg-black rounded-none border-2 border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Tài Khoản & Bảo Mật</span>
                  <span className="px-1.5 py-0.5 bg-neutral-900 text-cyan-300 border border-neutral-700 rounded-none text-[9px] font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    2FA Verified
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Tên người dùng: <span className="text-white font-mono font-bold">{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    onOpenAuth();
                    onClose();
                  }}
                  className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border-2 border-neutral-700 rounded-none text-white font-bold transition-all cursor-pointer text-xs active:scale-95"
                >
                  Quản Lý 2FA & Mật Khẩu
                </button>
              </div>

              {/* Cloudant Sync Control */}
              <div className="p-3 bg-black rounded-none border-2 border-neutral-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Trạng Thái Đồng Bộ Cloudant</div>
                  <div className="text-[10px] text-cyan-300 font-mono font-semibold">
                    {isSyncing ? 'Đang đồng bộ...' : 'Hoạt động bình thường'}
                  </div>
                </div>
                <button
                  onClick={onManualSync}
                  className="p-2 bg-neutral-900 text-cyan-300 hover:bg-neutral-800 border-2 border-neutral-700 rounded-none transition-all cursor-pointer active:scale-95"
                  title="Đồng bộ thủ công"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 bg-black border-t-2 border-neutral-800 text-[10px] text-neutral-400 flex justify-between items-center font-mono font-bold">
          <span>Watson Shell v4.0.1</span>
          <span className="text-cyan-300 font-bold">Cloudant Live Node</span>
        </div>
      </aside>
    </div>
  );
};
