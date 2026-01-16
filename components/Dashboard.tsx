'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import VIP_STRUCTURE from '@/lib/vip-structure.json';

type DailyRecord = {
  branch: string;
  vip_code: string;
  vip_name: string;
  date: string;
  count: number;
};

type VIPEntry = {
  code: string;
  name: string;
};

type Branch = {
  name: string;
  vips: VIPEntry[];
};

export default function Dashboard() {
  const [uploadedData, setUploadedData] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>('FLORIDA');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // State for branch dropdown
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  
  // State for date range selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VIP Management State
  const [isManageMode, setIsManageMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form State
  const [formVipCode, setFormVipCode] = useState('');
  const [formVipName, setFormVipName] = useState('');
  const [selectedVip, setSelectedVip] = useState<VIPEntry | null>(null);

  // VIP Structure State
  const [branches, setBranches] = useState<Branch[]>(VIP_STRUCTURE.branches as Branch[]);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Quick Entry State - Now supports individual VIP clients
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEntryVIPCounts, setQuickEntryVIPCounts] = useState<Record<string, string>>({});
  const [quickEntryWalkin, setQuickEntryWalkin] = useState('');
  const [quickEntryDate, setQuickEntryDate] = useState(new Date().toISOString().split('T')[0]);

  // Load VIP structure on mount
  useEffect(() => {
    fetch('/api/vip')
      .then(res => res.json())
      .then(data => {
        if (data.branches) setBranches(data.branches);
      });
  }, []);

  // Load parcel data from Supabase on mount and when month changes
  useEffect(() => {
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    
    fetch(`/api/data?startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.records) {
          setUploadedData(data.records);
        }
      })
      .catch(console.error);
  }, [selectedMonth, selectedYear]);

  // Generate date range (selected month/year)
  const dates = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(selectedYear, selectedMonth, i + 1);
      return date.toISOString().split('T')[0];
    });
    
    // Filter to only include dates from the selected month
    return monthDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [selectedMonth, selectedYear]);

  // Get active branch structure
  const activeBranch = branches.find(b => b.name === activeTab) || branches[0];

  // Check if this is a warehouse (only has WALKIN, no VIP clients)
  const isWarehouse = activeBranch?.vips.length === 1 && activeBranch?.vips[0].code === 'WALKIN';

  // Filter VIPs by search
  const filteredVIPs = useMemo(() => {
    if (!searchQuery) return activeBranch?.vips || [];
    
    const query = searchQuery.toLowerCase();
    return activeBranch.vips.filter(vip => 
      vip.name.toLowerCase().includes(query) ||
      vip.code.toLowerCase().includes(query)
    );
  }, [activeBranch, searchQuery]);

  // Build matrix data (VIPs x Dates)
  const matrixData = useMemo(() => {
    return filteredVIPs.map(vip => {
      const dateValues: {[key: string]: number} = {};
      let total = 0;

      dates.forEach(date => {
        // Find uploaded count for this VIP on this date
        const record = uploadedData.find(d => 
          d.branch === activeTab &&
          d.vip_code === vip.code &&
          d.date === date
        );
        const count = record?.count || 0;
        dateValues[date] = count;
        total += count;
      });

      return {
        code: vip.code,
        name: vip.name,
        branch: activeTab,
        dates: dateValues,
        total
      };
    });
  }, [filteredVIPs, dates, uploadedData, activeTab]);

  // Split data into clear sections
  const walkinRow = matrixData.find(r => r.code === 'WALKIN');
  const vipSummaryRow = matrixData.find(r => r.code === 'VIP');
  const vipIndividualRows = matrixData.filter(r => r.code !== 'WALKIN' && r.code !== 'VIP');

  // Stats
  const stats = useMemo(() => {
    const branchData = uploadedData.filter(d => d.branch === activeTab);
    const totalParcels = branchData.reduce((acc, curr) => acc + curr.count, 0);
    const walkInTotal = branchData.filter(d => d.vip_code === 'WALKIN').reduce((acc, curr) => acc + curr.count, 0);
    const vipTotal = branchData.filter(d => d.vip_code !== 'WALKIN' && d.vip_code !== 'VIP').reduce((acc, curr) => acc + curr.count, 0);
    
    return { totalParcels, walkInTotal, vipTotal };
  }, [uploadedData, activeTab]);

  // Target state
  const [targets, setTargets] = useState<{[key: string]: number}>({
    'FLORIDA': 5000,
    'LUBAO': 3000,
    'STO CRISTO': 10000,
    'MAGALANG': 2000,
    'WAREHOUSE': 1000
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState('');

  const currentTarget = targets[activeTab] || 0;
  const currentTotal = stats.totalParcels;
  const progressPercentage = Math.min((currentTotal / currentTarget) * 100, 100);

  const handleUpdateTarget = () => {
    const val = parseInt(tempTarget.replace(/,/g, ''));
    if (!isNaN(val) && val > 0) {
      setTargets(prev => ({...prev, [activeTab]: val}));
      setIsEditingTarget(false);
    }
  };
  
  // Helper function to get color based on count (heat map)
  const getCountColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-50 text-gray-400';
    
    const percentage = (count / maxCount) * 100;
    
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800 font-bold';
    if (percentage >= 60) return 'bg-green-100 text-green-700 font-semibold';
    if (percentage >= 40) return 'bg-blue-100 text-blue-700 font-medium';
    if (percentage >= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-50 text-orange-600';
  };
  
  // Calculate max count for color scaling
  const maxDailyCount = useMemo(() => {
    const allCounts = matrixData.flatMap(row => 
      Object.values(row.dates).filter(c => c > 0)
    );
    return allCounts.length > 0 ? Math.max(...allCounts) : 1;
  }, [matrixData]);
  
  // Month navigation helpers
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    
    if (!isCurrentMonth) {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };
  
  const goToCurrentMonth = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };
  
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setFileName(file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setUploadedData(result.fullData);
      } else {
        alert('Upload failed: ' + result.error);
        setFileName(null);
      }
    } catch (err) {
      alert('Error uploading file');
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVIP = async (action: 'ADD' | 'EDIT' | 'DELETE') => {
    const payload = {
      action,
      branchName: activeTab,
      vipCode: formVipCode,
      vipName: formVipName,
      oldVipCode: selectedVip?.code
    };

    const res = await fetch('/api/vip', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if (result.success) {
      setBranches(result.branches);
      setShowAddModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
      // Reset form
      setFormVipCode('');
      setFormVipName('');
      setSelectedVip(null);
    } else {
      alert(result.error);
    }
  };

  const openEditModal = (vip: VIPEntry) => {
    setSelectedVip(vip);
    setFormVipCode(vip.code);
    setFormVipName(vip.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (vip: VIPEntry) => {
    setSelectedVip(vip);
    setShowDeleteModal(true);
  };

  // Quick Entry Handler - Save individual VIP counts to database
  const handleQuickEntry = async () => {
    const walkinCount = parseInt(quickEntryWalkin) || 0;
    
    // Collect all VIP entries with counts
    const entries = [];
    
    // Add individual VIP client entries
    Object.entries(quickEntryVIPCounts).forEach(([vipCode, count]) => {
      const numCount = parseInt(count) || 0;
      if (numCount > 0) {
        const vip = activeBranch.vips.find(v => v.code === vipCode);
        if (vip) {
          entries.push({
            vip_code: vip.code,
            vip_name: vip.name,
            count: numCount
          });
        }
      }
    });
    
    // Add Walk-in entry
    if (walkinCount > 0) {
      entries.push({
        vip_code: 'WALKIN',
        vip_name: 'Walk-in Total',
        count: walkinCount
      });
    }

    if (entries.length === 0) {
      alert('Please enter at least one count');
      return;
    }
    
    try {
      // Submit to database
      const response = await fetch('/api/submit-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: activeTab,
          date: quickEntryDate,
          entries
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data from database
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
        
        const dataRes = await fetch(`/api/data?startDate=${startDate}&endDate=${endDate}`);
        const dataResult = await dataRes.json();
        
        if (dataResult.success) {
          setUploadedData(dataResult.records);
        }

        setSyncStatus('success');
        setSyncMessage(`✓ Saved ${entries.length} entries for ${quickEntryDate}`);
        
        // Reset and close
        setShowQuickEntry(false);
        setQuickEntryVIPCounts({});
        setQuickEntryWalkin('');
        
        setTimeout(() => setSyncStatus('idle'), 5000);
      } else {
        alert('Failed to save: ' + result.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - CLEAN WHITE MINIMALIST */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm text-gray-900">
        <div className="max-w-[1900px] mx-auto px-8 py-4">
          <div className="flex items-center gap-8 luxury-row">
            
            {/* 1. Logo & Title */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                 <img src="/logo.png" alt="LMXG Logo" className="w-full h-full object-contain p-1.5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none uppercase">Monitoring System</h1>
              </div>
            </div>

            {/* 2. Branch & Target Area (Flexible) */}
            <div className="flex flex-1 items-center gap-6 min-w-0">
               {/* Branch Selector */}
               <div className="relative z-50 shrink-0">
                   <button 
                     onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                     className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                   >
                      <div className="w-2 h-2 rounded-full bg-red-600"></div>
                      <span className="text-sm font-bold text-gray-700">{activeTab}</span>
                      <svg className={`w-3 h-3 text-gray-400 transition-transform ${isBranchDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                   </button>
                   {isBranchDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsBranchDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                           {branches.map(branch => (
                             <button
                               key={branch.name}
                               onClick={() => { setActiveTab(branch.name); setIsBranchDropdownOpen(false); }}
                               className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors flex items-center justify-between ${activeTab === branch.name ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                             >
                               {branch.name}
                               {activeTab === branch.name && <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                             </button>
                           ))}
                        </div>
                      </>
                   )}
               </div>

               {/* Target Progress Card */}
               <div className="flex-1 max-w-sm overflow-hidden min-w-[150px]">
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Target</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{progressPercentage.toFixed(1)}%</span>
                        <button onClick={() => setIsEditingTarget(true)} className="text-gray-300 hover:text-red-600 transition-colors">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                     </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                  {isEditingTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                       <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xs animate-in zoom-in-95 duration-200">
                          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Set Monthly Target</h3>
                          <input 
                            type="text" autoFocus className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none mb-4" 
                            placeholder={currentTarget.toString()} value={tempTarget} onChange={(e) => setTempTarget(e.target.value.replace(/[^0-9]/g, ''))}
                          />
                          <div className="flex gap-2 justify-end">
                              <button onClick={() => setIsEditingTarget(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                              <button onClick={() => { handleUpdateTarget(); setIsEditingTarget(false); }} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">Save Changes</button>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* 3. Stats & Action Buttons (Right) */}
            <div className="flex items-center gap-6 shrink-0">
               {/* Stats Pills - COMPACT FLAT */}
               <div className="flex items-center gap-2">
                  {[
                    { label: 'Total', val: stats.totalParcels, cls: 'text-blue-600 bg-blue-50/50' },
                    { label: 'VIP', val: stats.vipTotal, cls: 'text-purple-600 bg-purple-50/50' },
                    { label: 'Walk-in', val: stats.walkInTotal, cls: 'text-amber-600 bg-amber-50/50' }
                  ].map(p => (
                    <div key={p.label} className={`flex flex-col items-center justify-center min-w-[75px] h-12 bg-white border border-gray-100 rounded-lg shadow-sm ${p.cls}`}>
                       <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">{p.label}</span>
                       <span className={`text-base font-black leading-none`}>{p.val.toLocaleString()}</span>
                    </div>
                  ))}
               </div>

               {/* Actions */}
               <div className="flex items-center gap-2">
                  {/* Date Switcher */}
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-10 px-1">
                     <button onClick={goToPreviousMonth} className="px-2 hover:bg-white hover:text-red-600 rounded transition-colors text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
                     <span className="px-3 text-xs font-black text-gray-700 uppercase">{monthName}</span>
                     <button onClick={goToNextMonth} disabled={isCurrentMonth} className="px-2 hover:bg-white hover:text-red-600 rounded transition-colors text-gray-400 disabled:opacity-20"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
                  </div>

                  <button 
                    onClick={() => setShowQuickEntry(true)} 
                    className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    <span>Quick Add</span>
                  </button>

                  <button 
                    onClick={() => {
                        const csv = [['Date', 'Branch', 'VIP Code', 'VIP Name', 'Count'].join(','), ...uploadedData.map(r => [r.date, r.branch, r.vip_code || r.vipCode, r.vip_name || r.vipName, r.count].join(','))].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `parcels-${activeTab}.csv`; a.click();
                    }}
                    className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-black uppercase rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>Export</span>
                  </button>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1900px] mx-auto px-8 py-6 space-y-5">
        {/* NEW WALKIN SECTION */}
        {walkinRow && (
          <div className="mb-8 bg-white border border-amber-100 rounded-xl shadow-sm overflow-hidden">
             <div className="bg-amber-50/50 px-6 py-3 border-b border-amber-100 flex items-center">
                <div className="flex items-center gap-3">
                   <h3 className="font-bold text-amber-900">Walk-in Parcels</h3>
                </div>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                   <thead>
                     <tr className="border-b border-gray-100">
                        {dates.map(date => (
                          <th key={date} className="px-3 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 whitespace-nowrap">
                             {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </th>
                        ))}
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="hover:bg-amber-50/10 transition-colors">
                         {dates.map(date => {
                           const count = walkinRow.dates[date] || 0;
                           const colorClass = getCountColor(count, maxDailyCount);
                           const isToday = date === new Date().toISOString().split('T')[0];
                           
                           return (
                              <td key={date} className="p-2 text-center">
                                 <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all ${
                                   colorClass
                                 } ${
                                   isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                                 }`}>
                                    {count > 0 ? count : '-'}
                                 </span>
                              </td>
                           );
                         })}
                     </tr>
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Actions - Only show for branches with VIP clients */}
          {!isWarehouse && (
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50/30">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsManageMode(!isManageMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                    isManageMode 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isManageMode ? 'Done Managing' : 'Manage VIPs'}
                </button>
                {isManageMode && (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add VIP
                  </button>
                )}
              </div>
              
              <div className="relative w-full sm:w-72 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all shadow-sm"
                  placeholder="Search VIP name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
        
        <div className="table-container">
          <div className="overflow-x-auto custom-scrollbar">
            {/* Only show VIP table for branches, not warehouses */}
            {!isWarehouse && (
              <table className="data-table">
                {/* MAIN HEADER (Applies to all) */}
                <thead className="sticky top-0 z-40 bg-gray-50 shadow-sm">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-40 shadow-sm w-40 py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">VIP Code</th>
                    <th className="min-w-[200px] py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">VIP Name</th>
                    {dates.map(date => (
                      <th key={date} className="text-center whitespace-nowrap min-w-[80px] py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                
                {/* INDIVIDUAL VIP ROWS */}
                <tbody className="bg-white">
                  {/* Individual VIP Rows */}
                  {vipIndividualRows.map((row, idx) => (
                    <tr key={idx} className="data-row">
                      <td className="sticky left-0 bg-white z-10 shadow-sm relative group">
                         <div className="flex items-center gap-2">
                            <span className="code-badge code-regular whitespace-nowrap min-w-[100px] text-center">
                              {row.code}
                            </span>
                            
                            {/* Manage Actions (Only for VIPs) */}
                            {isManageMode && (
                               <div className="flex items-center gap-1 ml-2">
                                  <button 
                                    onClick={() => openEditModal({code: row.code, name: row.name})}
                                    className="p-1 px-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 border border-blue-200 transition-colors" 
                                    title="Edit VIP"
                                  >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                  </button>
                                  <button 
                                    onClick={() => openDeleteModal({code: row.code, name: row.name})}
                                    className="p-1 px-2 bg-red-50 hover:bg-red-100 rounded text-red-600 border border-red-200 transition-colors" 
                                    title="Delete VIP"
                                  >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="font-medium text-gray-900">{row.name}</td>

                       {dates.map(date => {
                         const count = row.dates[date] || 0;
                         const colorClass = getCountColor(count, maxDailyCount);
                         const isToday = date === new Date().toISOString().split('T')[0];
                         
                         return (
                           <td key={date} className="text-center">
                             <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all ${
                               colorClass
                             } ${
                               isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                             }`}>
                               {count > 0 ? count : '-'}
                             </span>
                           </td>
                         );
                       })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{matrixData.length}</span> entries for <span className="font-semibold text-gray-900">{activeTab}</span>
          </div>
          {fileName && (
            <div className="text-gray-600">
              Data source: <span className="font-medium text-gray-900">{fileName}</span>
            </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New VIP to {activeTab}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIP Code</label>
                <input 
                  type="text" 
                  value={formVipCode}
                  onChange={e => setFormVipCode(e.target.value.toUpperCase())}
                  className="search-input w-full"
                  placeholder="e.g. NWL-F9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIP Name</label>
                <input 
                  type="text" 
                  value={formVipName}
                  onChange={e => setFormVipName(e.target.value.toUpperCase())}
                  className="search-input w-full"
                  placeholder="e.g. JUAN DELA CRUZ"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveVIP('ADD')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={!formVipCode || !formVipName}
              >
                Add VIP
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit VIP</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIP Code</label>
                <input 
                  type="text" 
                  value={formVipCode}
                  onChange={e => setFormVipCode(e.target.value.toUpperCase())}
                  className="search-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIP Name</label>
                <input 
                  type="text" 
                  value={formVipName}
                  onChange={e => setFormVipName(e.target.value.toUpperCase())}
                  className="search-input w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveVIP('EDIT')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

            {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete VIP?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold">{selectedVip?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveVIP('DELETE')}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Quick Entry Modal - Individual VIP Entry */}
      {showQuickEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Quick Add - {activeTab}</h3>
                    <p className="text-sm text-gray-500">Enter counts for each VIP client</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuickEntry(false);
                    setQuickEntryVIPCounts({});
                    setQuickEntryWalkin('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Date Selector */}
            <div className="px-6 pt-4 pb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date"
                value={quickEntryDate}
                onChange={e => setQuickEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            {/* Scrollable VIP List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {/* VIP Clients Section */}
              {!isWarehouse && activeBranch.vips.filter(v =>v.code !== 'WALKIN' && v.code !== 'VIP').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    VIP Clients
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {activeBranch.vips.filter(v => v.code !== 'WALKIN' && v.code !== 'VIP').map(vip => (
                      <div key={vip.code} className="flex flex-col">
                        <label className="text-xs font-medium text-gray-700 mb-1 truncate" title={vip.name}>
                          {vip.name}
                        </label>
                        <input 
                          type="number"
                          value={quickEntryVIPCounts[vip.code] || ''}
                          onChange={e => setQuickEntryVIPCounts(prev => ({
                            ...prev,
                            [vip.code]: e.target.value
                          }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickEntry();
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-bold text-right"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Walk-in Section */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  Walk-in Shipments
                </h4>
                <input 
                  type="number"
                  value={quickEntryWalkin}
                  onChange={e => setQuickEntryWalkin(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickEntry();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-bold text-right"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Footer with Live Total */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {/* Live Total */}
              <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-semibold text-blue-900">Total for {quickEntryDate}:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {(
                    Object.values(quickEntryVIPCounts).reduce((sum, val) => sum + (parseInt(val) || 0), 0) +
                    (parseInt(quickEntryWalkin) || 0)
                  ).toLocaleString()}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowQuickEntry(false);
                    setQuickEntryVIPCounts({});
                    setQuickEntryWalkin('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleQuickEntry}
                  className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Save All Counts
                </button>
              </div>

              {/* Keyboard Hint */}
              <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd> to save quickly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
