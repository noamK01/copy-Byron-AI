import React, { useState, useMemo } from 'react';
import { User, CallLog, CallOutcome, ExportData } from '../types';
import { OUTCOME_OPTIONS, APP_NAME } from '../constants';
import { Phone, TrendingUp, AlertTriangle, LogOut, CheckCircle2, LayoutDashboard, History, Send, Settings, ThumbsUp, X, ChevronDown, Check, ShieldAlert, Users, ShieldCheck, ArrowRight, BarChart3, Mail } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  user: User;
  usersList?: User[]; 
  onLogout: () => void;
  calls: CallLog[];     // Only current user calls
  allCalls: CallLog[];  // All system calls
  onAddCall: (outcome: CallOutcome) => void;
  onUpdateUserRole?: (userId: string, newRole: 'admin' | 'agent') => void;
}

type TabView = 'report' | 'analytics' | 'settings' | 'admin';

const Dashboard: React.FC<DashboardProps> = ({ user, usersList = [], onLogout, calls, allCalls, onAddCall, onUpdateUserRole }) => {
  const [activeTab, setActiveTab] = useState<TabView>(user.role === 'admin' ? 'admin' : 'report');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null); // For Admin drill-down
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Reporting State
  const [showRefusalOptions, setShowRefusalOptions] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // --- Helpers ---
  
  const handleQuickClose = () => {
    onAddCall(CallOutcome.CLOSED);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
    setShowRefusalOptions(false); 
  };

  const handleRefusalSelect = (outcome: CallOutcome) => {
    onAddCall(outcome);
    setShowRefusalOptions(false);
  };

  const handleToggleRole = (targetUser: User) => {
    if (!onUpdateUserRole) return;
    const newRole = targetUser.role === 'admin' ? 'agent' : 'admin';
    if (window.confirm(`האם אתה בטוח שברצונך לשנות את ההרשאה של ${targetUser.name} ל-${newRole === 'admin' ? 'מנהל' : 'נציג'}?`)) {
      onUpdateUserRole(targetUser.id, newRole);
    }
  };

  // --- Analytics Calculations ---

  // Decide which calls to show: If admin selected an agent, show that agent's calls. Otherwise show current user's calls.
  const activeCallsData = useMemo(() => {
    // If we are in Admin tab AND an agent is selected, filter from ALL calls
    if (activeTab === 'admin' && selectedAgentId) {
        return allCalls.filter(c => c.agentId === selectedAgentId);
    }
    // Otherwise (Report/Analytics tabs OR Admin list view), show the logged-in user's calls
    return calls;
  }, [calls, allCalls, activeTab, selectedAgentId]);

  const stats = useMemo(() => {
    const totalCalls = activeCallsData.length;
    const closedCalls = activeCallsData.filter(c => c.outcome === CallOutcome.CLOSED).length;
    const notClosedCalls = totalCalls - closedCalls;
    const closeRate = totalCalls > 0 ? (closedCalls / totalCalls) * 100 : 0;

    const refusalCounts: Record<string, number> = {};
    activeCallsData.forEach(c => {
      if (c.outcome !== CallOutcome.CLOSED) {
        refusalCounts[c.outcome] = (refusalCounts[c.outcome] || 0) + 1;
      }
    });

    let mostCommonRefusal = 'אין נתונים';
    let maxCount = 0;
    Object.entries(refusalCounts).forEach(([reason, count]) => {
      const numCount = Number(count); // Explicitly cast to number
      if (numCount > maxCount) {
        maxCount = numCount;
        mostCommonRefusal = reason;
      }
    });

    return {
      totalCalls,
      closedCalls,
      notClosedCalls,
      closeRate: closeRate.toFixed(1),
      mostCommonRefusal,
      refusalCounts
    };
  }, [activeCallsData]);

  // --- Admin Agent List Calculation ---
  
  const adminAgentStats = useMemo(() => {
    if (user.role !== 'admin') return [];

    return usersList.map(u => {
        const agentCalls = allCalls.filter(c => c.agentId === u.id);
        const total = agentCalls.length;
        const closed = agentCalls.filter(c => c.outcome === CallOutcome.CLOSED).length;
        const rate = total > 0 ? (closed / total) * 100 : 0;

        return {
            ...u,
            total,
            closed,
            rate
        };
    }).sort((a, b) => a.rate - b.rate); 

  }, [allCalls, usersList, user.role]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    if (stats.closedCalls > 0) {
      data.push({ name: 'נסגר', value: stats.closedCalls, color: '#8b5cf6' });
    }
    Object.entries(stats.refusalCounts).forEach(([reason, count]) => {
        let color = '#ef4444';
        if (reason === CallOutcome.NO_CREDIT) color = '#f97316';
        if (reason === CallOutcome.NO_MONEY) color = '#ef4444';
        if (reason === CallOutcome.HANGUP) color = '#6b7280';
        data.push({ name: reason, value: Number(count), color }); // Explicitly cast to number
    });
    return data;
  }, [stats]);


  // --- Export Logic ---

  const handleExport = async () => {
    setIsSending(true);
    const today = new Date().toLocaleDateString('he-IL');
    
    const lowPerformanceAgents: string[] = adminAgentStats
        .filter(a => a.rate < 30 && a.total > 0)
        .map(a => a.name);

    const exportData: ExportData = {
      date: today,
      agentName: user.name,
      totalCalls: stats.totalCalls,
      notClosedCount: stats.notClosedCalls,
      closedCount: stats.closedCalls,
      mostCommonRefusal: stats.mostCommonRefusal,
      lowPerformanceAgents: lowPerformanceAgents
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `byron_report_${user.name}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastExport(`נשלח בהצלחה! (${new Date().toLocaleTimeString()})`);
    setIsSending(false);
  };

  // Reusable Analytics View (Used for both personal dashboard and admin drill-down)
  const renderAnalyticsView = (title: string, showBackButton = false) => (
    <div className="space-y-6 animate-fade-in">
        {showBackButton && (
            <button 
                onClick={() => setSelectedAgentId(null)} 
                className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition mb-2"
            >
                <ArrowRight size={20} /> חזרה לרשימת הנציגים
            </button>
        )}

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200 relative overflow-hidden">
            <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">הצלחה</span>
            </div>
            <h3 className="text-lg font-medium opacity-90 mb-1">אחוזי סגירה</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">{stats.closeRate}%</span>
            </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden">
            <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg"><AlertTriangle size={24} /></div>
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">נפוץ ביותר</span>
            </div>
            <h3 className="text-lg font-medium opacity-90 mb-1">סיבת סירוב</h3>
            <span className="text-3xl font-bold block mt-2">{stats.mostCommonRefusal}</span>
            </div>
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-black/5 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
            <div className="p-3 bg-gray-50 rounded-xl text-gray-500"><Phone size={24} /></div>
            <h3 className="text-gray-500 font-medium">סה"כ שיחות</h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
            <span className="text-5xl font-bold text-gray-800">{stats.totalCalls}</span>
            <div className="flex flex-col text-xs font-medium space-y-1">
                <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{stats.closedCalls} סגירות</span>
                <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{stats.notClosedCalls} סירובים</span>
            </div>
            </div>
        </div>
        </div>

        {/* Chart & History Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">התפלגות שיחות</h3>
                <div className="h-64 w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={32} className="opacity-20 mb-2" />
                    <p>אין נתונים להצגה</p>
                    </div>
                )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <History className="text-gray-500" size={20} />
                   היסטוריית שיחות
                </h3>
                {activeCallsData.length > 0 ? (
                  <div className="overflow-y-auto max-h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">שעה</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">תוצאה</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeCallsData.slice().reverse().slice(0, 20).map((call) => (
                          <tr key={call.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(call.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                call.outcome === CallOutcome.CLOSED ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {call.outcome}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    אין נתונים לשיחות
                  </div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-purple-500/50">
            B
          </div>
          <span className="font-bold text-xl tracking-wide">{APP_NAME}</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          
          {user.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('admin'); setSelectedAgentId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'admin' 
                  ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">ניהול נציגים</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'report' 
                ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Phone size={20} />
            <span className="font-medium">דיווח שיחה</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'analytics' 
                ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">דשבורד ונתונים</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">הגדרות וייצוא</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs relative">
               {user.name.charAt(0)}
               {user.role === 'admin' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium truncate">{user.name}</p>
               <p className="text-xs text-slate-500 truncate capitalize">{user.role === 'admin' ? 'מנהל מערכת' : 'נציג מכירות'}</p>
             </div>
           </div>
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 py-2 rounded-lg transition"
           >
             <LogOut size={16} />
             <span>התנתק</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'admin' && (selectedAgentId ? 'דוח נציג מפורט' : 'ניהול נציגים')}
                {activeTab === 'report' && 'דיווח שיחה חדשה'}
                {activeTab === 'analytics' && 'דשבורד אישי'}
                {activeTab === 'settings' && 'הגדרות מערכת'}
              </h2>
              <p className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </header>

          {/* VIEW: ADMIN */}
          {activeTab === 'admin' && user.role === 'admin' && (
             <div className="space-y-6 animate-fade-in">
                
                {selectedAgentId ? (
                    // DRILL DOWN VIEW
                    renderAnalyticsView('דוח נציג', true)
                ) : (
                    // MAIN ADMIN LIST (CARDS)
                    <>
                        {/* Alert for low performance */}
                        {adminAgentStats.some(a => a.rate < 30 && a.total > 0 && a.role !== 'admin') && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                            <ShieldAlert className="text-red-500 flex-shrink-0" />
                            <div>
                            <h4 className="font-bold text-red-800">נדרשת תשומת לב ניהולית</h4>
                            <p className="text-sm text-red-700">
                                זוהו נציגים עם אחוזי סגירה נמוכים מ-30% (מסומנים באדום).
                            </p>
                            </div>
                        </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {adminAgentStats.map((agent) => {
                                const isLowPerformance = agent.rate < 30 && agent.total > 0 && agent.role !== 'admin';
                                
                                return (
                                    <div 
                                        key={agent.id} 
                                        className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 relative overflow-hidden group hover:shadow-lg ${
                                            isLowPerformance ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                                        agent.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {agent.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{agent.name}</h3>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail size={10} /> {agent.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {agent.role === 'admin' && <ShieldCheck className="text-purple-500" size={18} />}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                                    <span className="text-xs text-gray-500 block">סה"כ שיחות</span>
                                                    <span className="font-bold text-gray-800 text-lg">{agent.total}</span>
                                                </div>
                                                <div className={`p-3 rounded-xl text-center ${
                                                    agent.rate >= 30 ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    <span className="text-xs opacity-80 block">אחוז סגירה</span>
                                                    <span className="font-bold text-lg">{agent.rate.toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedAgentId(agent.id)}
                                                    className="flex-1 bg-slate-800 text-white text-sm py-2 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <BarChart3 size={16} />
                                                    צפה בנתונים
                                                </button>
                                                
                                                {agent.id !== user.id && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleRole(agent); }}
                                                        className={`px-3 py-2 rounded-lg border text-sm transition ${
                                                            agent.role === 'admin' 
                                                            ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                                                        }`}
                                                        title={agent.role === 'admin' ? "הסר הרשאת מנהל" : "מנה למנהל"}
                                                    >
                                                        {agent.role === 'admin' ? <X size={16} /> : <ShieldCheck size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
             </div>
          )}

          {/* VIEW: REPORTING */}
          {activeTab === 'report' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Phone className="text-purple-600" size={24} />
                    סטטוס סיום שיחה
                  </h3>

                  {showSuccessMessage ? (
                     <div className="bg-purple-50 border border-purple-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="bg-purple-100 p-4 rounded-full mb-4">
                          <Check className="w-12 h-12 text-purple-600" />
                        </div>
                        <h4 className="text-2xl font-bold text-purple-800">השיחה תועדה בהצלחה!</h4>
                        <p className="text-purple-600">כל הכבוד על המכירה</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={handleQuickClose}
                        className="group relative bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-600 hover:text-white rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center gap-4"
                      >
                         <div className="bg-purple-50 p-4 rounded-full group-hover:bg-white/20 transition-colors duration-300">
                             <ThumbsUp size={40} className="text-purple-500 group-hover:text-white transition-colors duration-300" />
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold block">נסגרה עסקה!</span>
                            <span className="text-sm opacity-80">לחץ לתיעוד מהיר</span>
                          </div>
                      </button>

                      <button
                        onClick={() => setShowRefusalOptions(!showRefusalOptions)}
                        className={`group relative bg-white border-2 rounded-2xl p-8 transition-all duration-300 transform hover:shadow-lg flex flex-col items-center gap-4 ${
                          showRefusalOptions 
                            ? 'border-slate-500 text-slate-600 hover:bg-slate-500 hover:text-white' 
                            : 'border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white'
                        }`}
                      >
                         <div className={`p-4 rounded-full transition-colors duration-300 ${
                           showRefusalOptions ? 'bg-slate-100 group-hover:bg-white/20' : 'bg-orange-50 group-hover:bg-white/20'
                         }`}>
                             {showRefusalOptions ? (
                               <ChevronDown size={40} className={`transition-colors duration-300 ${showRefusalOptions ? 'text-slate-500 group-hover:text-white' : ''}`} />
                             ) : (
                               <X size={40} className="text-orange-500 group-hover:text-white transition-colors duration-300" />
                             )}
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold block">{showRefusalOptions ? 'סגור אפשרויות' : 'לא נסגרה'}</span>
                            <span className="text-sm opacity-80">{showRefusalOptions ? 'לחץ לפירוט סיבת הסירוב' : 'לחץ לפירוט סיבת הסירוב'}</span>
                          </div>
                      </button>
                    </div>
                  )}

                  {showRefusalOptions && !showSuccessMessage && (
                    <div className="mt-8 pt-8 border-t border-gray-100 animate-slide-up">
                      <h4 className="text-gray-500 text-sm font-medium mb-4 text-center">בחר את סיבת הסירוב העיקרית:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {OUTCOME_OPTIONS.filter(o => o.value !== CallOutcome.CLOSED).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleRefusalSelect(option.value)}
                            className={`${option.color} hover:brightness-90 text-white font-medium py-4 px-4 rounded-xl transition shadow-md flex flex-col items-center justify-center gap-2 h-24 transform hover:scale-105 active:scale-95`}
                          >
                            <span className="text-lg">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ANALYTICS (Current User) */}
          {activeTab === 'analytics' && renderAnalyticsView('דשבורד אישי')}

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                 <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="text-gray-600" size={24} />
                    הגדרות ייצוא ואוטומציה
                 </h3>
                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h4 className="font-bold text-slate-800 mb-2">ייצוא דוח יומי</h4>
                    <button
                      onClick={handleExport}
                      disabled={isSending}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      {isSending ? (
                        <span className="animate-pulse">שולח נתונים...</span>
                      ) : (
                        <>
                          <Send size={20} />
                          שלח דוח ל-Make והורד JSON
                        </>
                      )}
                    </button>
                    {lastExport && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 inline-block">
                        <CheckCircle2 size={16} />
                        {lastExport}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;