import React, { useState, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from './config';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  ShieldAlert, 
  Truck, 
  Sparkles, 
  BookOpen, 
  Menu, 
  X, 
  Circle, 
  Cpu,
  Layers,
  Clock
} from 'lucide-react';

import DashboardHome from './components/DashboardHome';
import DemandPrediction from './components/DemandPrediction';
import ModelAnalysis from './components/ModelAnalysis';
import ATMRisk from './components/ATMRisk';
import DispatchCenter from './components/DispatchCenter';
import WhatIfPrediction from './components/WhatIfPrediction';
import AboutMethodology from './components/AboutMethodology';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Health check polling
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/`);
        if (res.ok) setApiOnline(true);
        else setApiOnline(false);
      } catch {
        setApiOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecasting', label: 'Demand Forecasting', icon: TrendingUp },
    { id: 'analysis', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'risk', label: 'Stockout Risk', icon: ShieldAlert },
    { id: 'dispatch', label: 'Dispatch Center', icon: Truck },
    { id: 'simulator', label: 'What-If Simulator', icon: Sparkles },
    { id: 'about', label: 'Methodology & PBL', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome setActiveTab={setActiveTab} />;
      case 'forecasting': return <DemandPrediction />;
      case 'analysis': return <ModelAnalysis />;
      case 'risk': return <ATMRisk />;
      case 'dispatch': return <DispatchCenter />;
      case 'simulator': return <WhatIfPrediction />;
      case 'about': return <AboutMethodology />;
      default: return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50 ">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-gray-900 font-black shadow-sm">
            ATM
          </div>
          <span className="font-extrabold text-sm tracking-tight text-gray-900">Smart Engine</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white md:bg-white border-r border-gray-200 p-5 flex flex-col justify-between  transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-gray-900 font-black text-sm shadow-sm">
              ATM
            </div>
            <div>
              <div className="font-extrabold text-sm text-gray-900 tracking-tight">ATM Dispatcher</div>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">PBL Decision Engine</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer
                    ${isActive 
                      ? 'bg-blue-600 text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: System Telemetry Status */}
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-medium">FastAPI Status</span>
              <span className={`inline-flex items-center gap-1.5 font-bold ${apiOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                <Circle className={`w-2 h-2 fill-current ${apiOnline ? 'animate-pulse' : ''}`} />
                {apiOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200">
              <span>Port</span>
              <span className="font-mono text-gray-700">8000</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-500 font-medium">
            AI & Data Science • PBL 2026
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200  sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="capitalize">{activeTab.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-700 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime}</span>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              apiOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20' : 'bg-red-50 text-red-600 border border-red-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span>{apiOnline ? 'ML Backend Connected' : 'Backend Disconnected'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
