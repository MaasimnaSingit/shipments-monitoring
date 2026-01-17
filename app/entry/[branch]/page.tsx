'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface VIPClient {
  code: string;
  name: string;
}

interface EntryRecord {
  id: string;
  branch: string;
  date: string;
  vip_code: string;
  vip_name: string;
  count: number;
}

interface Notification {
  id: string;
  message: string;
  target_branch: string;
  type: 'INFO' | 'URGENT';
  is_active: boolean;
  created_at: string;
}

export default function BranchEntryPage() {
  const params = useParams();
  const router = useRouter();
  const branchName = (params.branch as string).toUpperCase();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vipClients, setVipClients] = useState<VIPClient[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [myEntries, setMyEntries] = useState<EntryRecord[]>([]);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentNotification, setUrgentNotification] = useState<Notification | null>(null);
  
  // Store the actual database branch name (e.g., "STO CRISTO" not "STO-CRISTO")
  const [resolvedBranchName, setResolvedBranchName] = useState<string>('');
  
  // Get current month info
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Load VIP structure for this branch
  useEffect(() => {
    fetch('/api/vip')
      .then(res => res.json())
      .then(data => {
        // Normalize the URL branch name: 'sto-cristo' -> 'STO CRISTO'
        const normalizedUrlBranch = decodeURIComponent(branchName)
          .replace(/-/g, ' ')
          .toUpperCase();
          
        const branchData = data.branches?.find((b: { name: string }) => 
          b.name.toUpperCase() === normalizedUrlBranch ||
          b.name.toUpperCase() === branchName.replace(/%20/g, ' ')
        );
        if (branchData) {
          // Store actual DB branch name
          setResolvedBranchName(branchData.name);

          // Store actual DB branch name
          setResolvedBranchName(branchData.name);
          
          const filteredVips = (branchData.vips || []).filter(
            (vip: VIPClient) => vip.code !== 'VIP' && vip.code !== 'WALKIN'
          );
          setVipClients(filteredVips);
          
          const initialCounts: Record<string, string> = {};
          branchData.vips?.forEach((vip: VIPClient) => {
            initialCounts[vip.code] = '';
          });
          initialCounts['WALKIN'] = '';
          setCounts(initialCounts);
        } else {
          // 🛡️ BRANCH VALIDATION: If branch not found, kick back to dashboard
          console.error(`Invalid branch: ${branchName}`);
          router.push('/');
        }
      });
  }, [branchName, router]);

  const loadMyEntries = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    fetch(`/api/data?branch=${resolvedBranchName || branchName}&startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMyEntries(data.records || []);
        }
      });
  };

  useEffect(() => {
    loadMyEntries();
  }, [branchName]);

  // Load notifications for this branch
  useEffect(() => {
    if (!resolvedBranchName) return;
    
    const fetchNotifications = () => {
      fetch(`/api/notifications?branch=${encodeURIComponent(resolvedBranchName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.notifications?.length > 0) {
            setNotifications(data.notifications);
            
            // Check for URGENT notifications
            const urgent = data.notifications.find((n: Notification) => n.type === 'URGENT');
            if (urgent) {
              setUrgentNotification(urgent);
              setShowUrgentModal(true);
            }
          } else {
             setNotifications([]); // Clear if no active notifications
          }
        })
        .catch(console.error);
    };

    fetchNotifications();

    // Set up Realtime Subscription for Notifications
    import('@/lib/supabase').then(({ supabase }) => {
      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('Notification update received!', payload);
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [resolvedBranchName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const entries = [];
      
      for (const vip of vipClients) {
        const count = parseInt(counts[vip.code] || '0');
        if (count > 0) {
          entries.push({
            vip_code: vip.code,
            vip_name: vip.name,
            count
          });
        }
      }

      const walkinCount = parseInt(counts['WALKIN'] || '0');
      if (walkinCount > 0) {
        entries.push({
          vip_code: 'WALKIN',
          vip_name: 'Walk-in Total',
          count: walkinCount
        });
      }

      if (entries.length === 0) {
        setMessage({ type: 'error', text: 'Please enter at least one count before submitting.' });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/submit-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: resolvedBranchName || branchName,
          date,
          entries
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Successfully saved ${entries.length} entries for ${date}!` });
        loadMyEntries();
        const resetCounts: Record<string, string> = {};
        vipClients.forEach(vip => {
          resetCounts[vip.code] = '';
        });
        resetCounts['WALKIN'] = '';
        setCounts(resetCounts);
        
        // Auto clear success message after 3s
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save data' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotal = Object.values(counts).reduce((sum, val) => sum + (parseInt(val as string) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* PROFESSIONAL HEADER */}
      <div className="w-full bg-white border-b border-gray-200 py-6 mb-8 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 flex flex-col items-center text-center">
          <div 
            onClick={() => router.push('/')}
            className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm mb-4 p-2 cursor-pointer hover:border-red-400 transition-colors"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
            {resolvedBranchName || branchName.replace(/-/g, ' ')} BRANCH
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Daily Shipment Entry</p>
          
          <button
            type="button"
            onClick={() => { loadMyEntries(); setShowMonitorModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-black uppercase rounded-lg transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
            </svg>
            View Monitoring Sheet
          </button>
        </div>
      </div>

      <div className="max-w-xl w-full px-4 mb-20">
        {/* FORM CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* DATE PICKER PART */}
            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Date</label>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-black text-gray-800 outline-none transition-all shadow-sm"
                required
              />
            </div>

            <div className="p-6 space-y-6">
              {/* VIP SECTION */}
              {vipClients.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">VIP Clients</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {vipClients.map(vip => (
                      <div key={vip.code} className="group p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-bold text-gray-700 truncate">{vip.name}</p>
                          <p className="text-[10px] font-mono font-bold text-gray-400">{vip.code}</p>
                        </div>
                        <input 
                          type="number"
                          value={counts[vip.code] || ''}
                          onChange={e => setCounts(prev => ({ ...prev, [vip.code]: e.target.value }))}
                          className="w-24 px-3 py-2 bg-gray-50 group-hover:bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-black text-right outline-none transition-all"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WALKIN SECTION */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Walk-in Shipments</h3>
                </div>
                <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-amber-900">Walk-in Total</p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase">General Retail</p>
                  </div>
                  <input 
                    type="number"
                    value={counts['WALKIN'] || ''}
                    onChange={e => setCounts(prev => ({ ...prev, WALKIN: e.target.value }))}
                    className="w-24 px-3 py-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base font-black text-right outline-none transition-all"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* LIVE TOTAL SUMMARY */}
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-gray-900 rounded-xl p-5 flex flex-col items-center text-center shadow-lg">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Calculated Count</p>
                  <p className={`text-4xl font-black ${currentTotal > 0 ? 'text-white' : 'text-gray-700'} transition-colors`}>
                    {currentTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* MESSAGE FEEDBACK */}
            {message && (
              <div className="px-6 mb-4">
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <p className="text-xs font-bold uppercase">{message.text}</p>
                </div>
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Submit Monthly Entry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Secured Enterprise Portal • DskLab Solutions
        </p>
      </div>

      {/* MONITORING SHEET MODAL */}
      {showMonitorModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-100">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase">{branchName} ANALYTICS</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                      {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Report
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="hidden sm:block text-right">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Current Month Total</p>
                   <p className="text-2xl font-black text-red-600">{myEntries.reduce((sum, e) => sum + e.count, 0).toLocaleString()}</p>
                 </div>
                 <button onClick={() => setShowMonitorModal(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                   <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
               </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              {myEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-gray-300">
                  <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <p className="text-lg font-black text-gray-400 uppercase tracking-[0.2em]">Data Warehouse Empty</p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="sticky left-0 bg-gray-50 z-10 px-4 py-4 text-left font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 min-w-[200px]">CLIENT / VIP</th>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                          <th key={day} className="px-2 py-4 text-center font-black text-gray-400 border-b border-gray-200 min-w-[45px]">{day}</th>
                        ))}
                        <th className="px-4 py-4 text-right font-black text-red-600 border-b border-gray-200 bg-red-50/50">TOT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...vipClients, { code: 'WALKIN', name: 'Walk-in' }].map(vip => {
                        const vipEntries = myEntries.filter(e => e.vip_code === vip.code);
                        const vipTotal = vipEntries.reduce((sum, e) => sum + e.count, 0);
                        
                        return (
                          <tr key={vip.code} className="hover:bg-gray-50 transition-colors">
                            <td className="sticky left-0 bg-white z-10 px-4 py-3 font-bold text-gray-800 border-r border-gray-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                              <p className="truncate w-full uppercase tracking-tight">{vip.name}</p>
                              <p className="text-[9px] font-mono font-bold text-gray-400">{vip.code}</p>
                            </td>
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const day = i + 1;
                              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const entry = vipEntries.find(e => e.date === dateStr);
                              return (
                                <td key={day} className={`px-1 py-3 text-center ${entry && entry.count > 0 ? 'bg-red-50/20' : ''}`}>
                                  {entry && entry.count > 0 ? (
                                    <span className="font-black text-gray-900">{entry.count}</span>
                                  ) : (
                                    <span className="text-gray-100 text-[8px] font-black">0</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right font-black text-red-600 bg-red-50/50">
                              {vipTotal > 0 ? vipTotal.toLocaleString() : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-900 text-white font-black uppercase text-[10px]">
                      <tr>
                        <td className="sticky left-0 bg-gray-900 z-10 px-4 py-5 border-t border-gray-800 tracking-[0.2em]">Daily Volume</td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dayTotal = myEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.count, 0);
                          return (
                            <td key={day} className="px-1 py-5 text-center text-red-400 border-t border-gray-800">
                              {dayTotal > 0 ? dayTotal : ''}
                            </td>
                          );
                        })}
                        <td className="px-4 py-5 text-right text-base border-t border-gray-800 text-red-500">
                          {myEntries.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Notification Banner */}
      {notifications.filter(n => n.type === 'INFO').length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          {notifications.filter(n => n.type === 'INFO').map(n => (
            <div key={n.id} className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold">Message from Admin</p>
                <p className="text-sm opacity-90">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Urgent Notification Modal */}
      {showUrgentModal && urgentNotification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase">Urgent Notice</h3>
            <p className="text-gray-700 mb-6">{urgentNotification.message}</p>
            <button 
              onClick={() => setShowUrgentModal(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase rounded-lg shadow-lg transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
