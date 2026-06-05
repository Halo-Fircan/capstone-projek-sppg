import React from 'react';

const StatCard = ({ title, value, icon, trend, trendLabel, isPositive }) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-200 text-left">
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1 truncate" title={title}>
            {title}
          </p>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight truncate" title={value}>
            {value}
          </h3>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs">
        <span className={`font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? '↑' : '↓'} {trend}
        </span>
        <span className="text-slate-400 truncate max-w-[80px] sm:max-w-none" title={trendLabel}>
          {trendLabel}
        </span>
      </div>
    </div>
  );
};

export default StatCard;