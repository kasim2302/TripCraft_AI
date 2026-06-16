import React from 'react';

const StatWidget = ({ title, value, icon: Icon, colorClass = 'text-brand-teal', description }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-6 flex items-center gap-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <h4 className="text-2xl font-bold text-white mt-0.5 tracking-tight">{value}</h4>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default StatWidget;
