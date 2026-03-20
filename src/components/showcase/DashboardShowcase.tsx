'use client';

import Image from 'next/image';
import { Search, Bell, Plus, FileText, Zap, Clock, MessageSquare, DollarSign, Command, Wifi, RefreshCw, Target, Activity, CheckCircle, LayoutDashboard, BarChart3, Puzzle, Settings, HelpCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { PerformanceChart, CategoryChart } from './Charts';
import { RecentAutomations } from './RecentAutomations';

const LIKA_PHOTO = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150";

// Browser Chrome Wrapper
function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DCE9F6]">
      {/* Browser top bar — Now White */}
      <div className="bg-[#F8FAFE] px-4 py-3 flex items-center gap-4 border-b border-[#DCE9F6]">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] opacity-40" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] opacity-40" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] opacity-40" />
        </div>

        {/* URL bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="bg-white rounded-lg px-4 py-1.5 flex items-center gap-2 border border-[#DCE9F6]">
            <svg className="w-3.5 h-3.5 text-[#A5B4C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[11px] text-[#7E8A97] font-mono tracking-tight">app.allone.ge/intelligence</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="w-[68px]" />
      </div>

      {/* Browser content */}
      <div className="flex-1 bg-white overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// Live indicator component
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A68F5] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A68F5]"></span>
    </span>
  );
}

// Compact inline progress
function InlineProgress({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DCE9F6] rounded-lg">
      <div className="w-6 h-6 bg-[#F8FAFE] rounded flex items-center justify-center">
        <Target className="w-3 h-3 text-[#0A68F5]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-[#071D2F]">Efficiency</span>
          <span className="text-[10px] text-[#7E8A97] font-mono">{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-1 bg-[#F8FAFE] rounded-full overflow-hidden w-20">
          <div
            className="h-full bg-[#0A68F5] rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Compact sidebar for embedded dashboard (140px width)
const compactNavItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Activity, label: 'Systems', active: false },
  { icon: Zap, label: 'Automations', active: false },
  { icon: MessageSquare, label: 'AI Layer', active: false },
  { icon: Settings, label: 'Config', active: false },
];

function CompactSidebar() {
  return (
    <aside className="w-[145px] h-full bg-[#F8FAFE] border-r border-[#DCE9F6] flex flex-col py-4 relative flex-shrink-0">
      {/* Logo */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-[#071D2F] font-bold text-[14px] font-display tracking-tight uppercase">Allone</span>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="px-4 mb-2">
        <span className="text-[9px] font-bold text-[#7E8A97] uppercase tracking-[0.1em] font-mono">Control</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {compactNavItems.map((item, index) => (
          <button
            key={index}
            className={`w-full h-8 rounded-lg flex items-center gap-2.5 px-3 transition-all duration-200 ${
              item.active
                ? 'bg-[#0A68F5] text-white shadow-[0_4px_12px_rgba(10,104,245,0.2)]'
                : 'text-[#4A5B70] hover:text-[#071D2F] hover:bg-[#EBF3FF]'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Card */}
      <div className="mx-2 mt-auto p-2 rounded-xl bg-white border border-[#DCE9F6] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#DCE9F6] flex-shrink-0 shadow-sm relative">
            <Image
              src={LIKA_PHOTO}
              alt="Lika"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[#071D2F] truncate font-display">Lika M.</p>
            <p className="text-[9px] text-[#7E8A97] truncate font-mono uppercase tracking-tighter">Root</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DashboardContent() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="h-full w-full bg-white flex overflow-hidden font-sans relative">
      {/* Sidebar - compact version */}
      <CompactSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FFFFFF]">
        {/* Top Bar - compact */}
        <header className="h-12 bg-white border-b border-[#DCE9F6] flex items-center justify-between px-5 flex-shrink-0">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E8A97]" />
              <input
                type="text"
                placeholder="Search intelligence..."
                className="w-full h-8 pl-9 pr-10 rounded-full bg-[#F8FAFE] border border-[#DCE9F6] text-[11px] text-[#071D2F] placeholder-[#7E8A97] focus:outline-none focus:border-[#0A68F5] transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-[#DCE9F6]">
                <Command className="w-2 h-2 text-[#7E8A97]" />
                <span className="text-[8px] text-[#7E8A97] font-bold">K</span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative w-8 h-8 rounded-full hover:bg-[#F8FAFE] flex items-center justify-center transition-colors border border-transparent hover:border-[#DCE9F6]">
              <Bell className="w-4 h-4 text-[#4A5B70]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#0A68F5] rounded-full border border-white" />
            </button>
            <div className="w-px h-6 bg-[#DCE9F6]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-[#DCE9F6] shadow-sm relative">
                <Image
                  src={LIKA_PHOTO}
                  alt="Lika"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - compact */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFE]/30">
          <div className="p-5">
            {/* Welcome + Quick Actions Row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-[#071D2F] font-display tracking-tight">
                  Welcome back, Lika
                </h1>
                <p className="text-[#7E8A97] text-[11px] font-mono uppercase tracking-wider mt-0.5">{today}</p>
              </div>

              <div className="flex items-center gap-3">
                <InlineProgress current={1247} target={1500} />
                <button className="h-8 px-4 rounded-full bg-white border border-[#DCE9F6] text-[11px] font-bold text-[#4A5B70] flex items-center gap-1.5 hover:border-[#0A68F5] hover:text-[#0A68F5] transition-all shadow-sm">
                  <FileText className="w-3.5 h-3.5" />
                  Analytics
                </button>
                <button className="h-8 px-4 rounded-full bg-[#071D2F] text-[11px] font-bold text-white flex items-center gap-1.5 hover:bg-[#0A68F5] transition-all shadow-md">
                  <Plus className="w-3.5 h-3.5" />
                  Deploy
                </button>
              </div>
            </div>

            {/* Metrics Grid - compact */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <MetricCard
                title="Active Flows"
                value="1,247"
                change={12.5}
                icon={Zap}
                sparklineData={[20, 35, 30, 45, 55, 48, 65, 72, 80]}
                sparklineColor="#0A68F5"
                compact
              />
              <MetricCard
                title="Operational Gain"
                value="340 hrs"
                change={8.2}
                icon={Clock}
                sparklineData={[40, 38, 45, 50, 48, 55, 58, 62, 68]}
                sparklineColor="#0A68F5"
                compact
              />
              <MetricCard
                title="AI Inferences"
                value="89.4k"
                change={23.1}
                icon={MessageSquare}
                sparklineData={[25, 32, 40, 38, 52, 58, 65, 78, 89]}
                sparklineColor="#0A68F5"
                compact
              />
              <MetricCard
                title="Cost Efficiency"
                value="$42.8k"
                change={15.7}
                icon={DollarSign}
                sparklineData={[30, 35, 38, 42, 40, 48, 52, 58, 65]}
                sparklineColor="#0A68F5"
                compact
              />
            </div>

            {/* Charts Row - compact */}
            <div className="grid grid-cols-12 gap-3 mb-5">
              <div className="col-span-7">
                <PerformanceChart compact />
              </div>
              <div className="col-span-5">
                <CategoryChart compact />
              </div>
            </div>

            {/* Recent Automations - compact */}
            <div className="mb-2">
              <RecentAutomations compact />
            </div>
          </div>
        </div>

        {/* Status Bar - compact */}
        <div className="h-6 bg-white border-t border-[#DCE9F6] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#7E8A97] font-medium">
              <LiveDot />
              <span>Network Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#7E8A97] font-medium">
              <Wifi className="w-3 h-3 text-[#0A68F5]" />
              <span>Neural Link Secure</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#7E8A97]">
            <span className="font-mono uppercase tracking-tighter opacity-60">System Layer</span>
            <span className="text-[#071D2F] font-bold uppercase tracking-tight">ALLONE v2.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// Embeddable version for the landing page (no scaling, fits container exactly)
export function EmbeddableDashboard() {
  return (
    <div
      className="w-full"
      style={{ height: '600px' }}
    >
      <BrowserChrome>
        <DashboardContent />
      </BrowserChrome>
    </div>
  );
}

// Full page version for /dashboard-showcase route
export function DashboardShowcase() {
  return (
    <div className="h-screen w-full p-4 lg:p-8 bg-[#F8FAFE]">
      <BrowserChrome>
        <DashboardContent />
      </BrowserChrome>
    </div>
  );
}
