import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  /** Skip default body padding — use when the parent supplies its own (e.g. compact stats). */
  compact?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', actions, compact = false }) => {
  return (
    <div className={`glass-card shadow-xl transition-all hover:border-plex/40 group ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-bold text-text tracking-tight flex items-center gap-2">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={compact ? '' : 'p-5 md:p-6'}>
        {children}
      </div>
    </div>
  );
};
