'use client';

import { useMemo } from 'react';

type DailyRecord = {
  branch: string;
  vip_code: string;
  vip_name: string;
  date: string;
  count: number;
};

type BranchChartProps = {
  data: DailyRecord[];
  branches: { name: string }[];
};

export default function BranchChart({ data, branches }: BranchChartProps) {
  // Calculate stats per branch
  const branchStats = useMemo(() => {
    return branches.map(branch => {
      const branchData = data.filter(d => d.branch === branch.name);
      const vipTotal = branchData
        .filter(d => d.vip_code !== 'WALKIN' && d.vip_code !== 'VIP')
        .reduce((sum, r) => sum + r.count, 0);
      const walkinTotal = branchData
        .filter(d => d.vip_code === 'WALKIN')
        .reduce((sum, r) => sum + r.count, 0);
      const total = vipTotal + walkinTotal;

      return {
        name: branch.name,
        vipTotal,
        walkinTotal,
        total
      };
    }).sort((a, b) => b.total - a.total);
  }, [data, branches]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">

          <div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Branch Performance</h2>
            <p className="text-xs text-gray-500 font-medium">Quick overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">Walk-in</span>
          </div>
        </div>
      </div>

      {/* Compact Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {branchStats.map((branch) => {
          const vipPercentage = branch.total > 0 ? (branch.vipTotal / branch.total) * 100 : 0;
          const walkinPercentage = branch.total > 0 ? (branch.walkinTotal / branch.total) * 100 : 0;
          
          return (
            <div 
              key={branch.name} 
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group"
            >
              {/* Branch Name */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-tight truncate pr-2">
                  {branch.name}
                </h3>
                {branch.total > 0 && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                )}
              </div>

              {/* Total Count */}
              <div className="mb-3">
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {branch.total.toLocaleString()}
                </p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                  Total Parcels
                </p>
              </div>

              {/* Mini Progress Bar */}
              {branch.total > 0 ? (
                <div className="space-y-1.5">
                  {/* VIP */}
                  {branch.vipTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-purple-600 uppercase">VIP</span>
                        <span className="text-[9px] font-black text-gray-700">{branch.vipTotal.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${vipPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {/* Walk-in */}
                  {branch.walkinTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-amber-600 uppercase">Walk-in</span>
                        <span className="text-[9px] font-black text-gray-700">{branch.walkinTotal.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${walkinPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-12 text-[10px] text-gray-400 font-medium uppercase">
                  No data
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
