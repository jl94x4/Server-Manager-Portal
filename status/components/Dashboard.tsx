
import React, { useState, useMemo } from 'react';
import { Service, ServiceHealth, ServiceStatus, ServiceType, SystemAnnouncement, AnnouncementSeverity, Group } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from '../constants';
import SpeedTest from './SpeedTest';

interface DashboardProps {
  services: Service[];
  groups: Group[];
  healthData: Record<string, ServiceHealth>;
  announcement: SystemAnnouncement | null;
}

const getStatusColor = (status: ServiceStatus) => {
  switch (status) {
    case ServiceStatus.ONLINE: return 'bg-emerald-500';
    case ServiceStatus.OFFLINE: return 'bg-rose-500';
    case ServiceStatus.DEGRADED: return 'bg-amber-500';
    default: return 'bg-slate-300 dark:bg-slate-700';
  }
};

const getServiceIcon = (name: string, type: ServiceType) => {
  const n = name.toLowerCase();
  if (n.includes('plex')) return 'fa-solid fa-play';
  if (n.includes('overseerr')) return 'fa-solid fa-ticket';
  if (n.includes('tmdb') || n.includes('movie')) return 'fa-solid fa-film';
  if (n.includes('trakt')) return 'fa-solid fa-heart-pulse';
  if (n.includes('tvdb')) return 'fa-solid fa-tv';
  if (n.includes('radarr') || n.includes('sonarr') || n.includes('lidarr')) return 'fa-solid fa-hard-drive';
  if (n.includes('sabnzbd') || n.includes('torrent')) return 'fa-solid fa-cloud-arrow-down';
  return type === ServiceType.LOCAL ? 'fa-solid fa-server' : 'fa-solid fa-cloud';
};

interface ServiceCardProps {
  service: Service;
  health?: ServiceHealth;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, health }) => {
  const status = health?.currentStatus || ServiceStatus.UNKNOWN;
  const history = health?.history || [];
  const lastSnapshot = history.slice(-1)[0];
  const httpCode = lastSnapshot?.httpCode;

  return (
    <div className={`glass-panel rounded-2xl p-5 border transition-all duration-300 flex flex-col shadow-sm relative overflow-hidden group ${
      service.isCritical ? 'border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.05]' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
    }`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            status === ServiceStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 
            status === ServiceStatus.OFFLINE ? 'bg-rose-500/10 text-rose-600 dark:text-rose-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
          }`}>
            <i className={getServiceIcon(service.name, service.type)}></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{service.name}</h3>
              {service.isCritical && (
                <i className="fa-solid fa-star text-[10px] text-amber-500" title="Priority Service"></i>
              )}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">{service.category}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            status === ServiceStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
            status === ServiceStatus.OFFLINE ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === ServiceStatus.ONLINE ? 'bg-emerald-500' : status === ServiceStatus.OFFLINE ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
            {status}
          </div>
          <div className="flex items-center justify-end space-x-2 mt-1.5">
             {httpCode && httpCode > 0 && (
               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500" title="HTTP Status Code">
                 {httpCode}
               </span>
             )}
             <p className="text-[10px] font-mono font-medium text-slate-400">
               {lastSnapshot?.latency || '--'}ms
             </p>
          </div>
        </div>
      </div>

      {/* Uptime Blocks View */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-end gap-0.5 overflow-hidden h-8">
          {/* Fill empty space if history is short */}
          {Array.from({ length: Math.max(0, 45 - history.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-[1px]"></div>
          ))}
          {history.slice(-45).map((snap, i) => (
            <div 
              key={i} 
              className={`flex-1 min-w-[2px] rounded-[1px] transition-all hover:scale-y-110 ${getStatusColor(snap.status)}`}
              style={{ 
                height: snap.status === ServiceStatus.ONLINE ? '16px' : '24px',
                opacity: snap.status === ServiceStatus.ONLINE ? 0.7 : 1
              }}
              title={`${new Date(snap.timestamp).toLocaleTimeString()}: ${snap.status} (${snap.latency}ms) [${snap.httpCode || 'N/A'}]`}
            ></div>
          ))}
        </div>
      </div>

      {/* Live Latency Graph */}
      <div className="h-16 w-full mt-auto bg-slate-50 dark:bg-slate-900/50 rounded-xl p-0 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
        <div className="absolute top-2 left-3 z-10 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Latency</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history.slice(-20)}>
            <defs>
              <linearGradient id={`grad-${service.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={service.isCritical ? "#f59e0b" : "#6366f1"} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={service.isCritical ? "#f59e0b" : "#6366f1"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="latency" 
              stroke={service.isCritical ? "#f59e0b" : "#6366f1"} 
              strokeWidth={2} 
              fill={`url(#grad-${service.id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ services, groups, healthData, announcement }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const globalStatus = useMemo(() => {
    const statuses = Object.values(healthData).map((h: ServiceHealth) => h.currentStatus);
    if (statuses.length === 0) return 'UNKNOWN';
    if (statuses.some(s => s === ServiceStatus.OFFLINE)) return 'INCIDENT';
    if (statuses.some(s => s === ServiceStatus.DEGRADED)) return 'DEGRADED';
    return 'OPERATIONAL';
  }, [healthData]);

  const globalUptime = useMemo(() => {
    const active = Object.values(healthData);
    if (active.length === 0) return 0;
    const sum = active.reduce<number>((acc, h: ServiceHealth) => acc + (h.uptimePercentage || 0), 0);
    return Math.round(sum / active.length);
  }, [healthData]);

  // Calculate Real Performance Metrics
  const calculateAggregateUptime = (samples: number) => {
    let totalSamples = 0;
    let successfulSamples = 0;
    
    // Iterate through all active services
    services.forEach(service => {
      const health = healthData[service.id];
      if (!health) return;
      
      const historySlice = health.history.slice(-samples);
      if (historySlice.length === 0) return;
      
      totalSamples += historySlice.length;
      successfulSamples += historySlice.filter(s => s.status === ServiceStatus.ONLINE).length;
    });

    if (totalSamples === 0) return '100.00';
    return ((successfulSamples / totalSamples) * 100).toFixed(2);
  };

  const hourlyUptime = calculateAggregateUptime(360); // Last hour (approx 360 checks)
  const dailyUptime = calculateAggregateUptime(8640); // Last 24 hours (approx 8640 checks)
  const monthlyUptime = calculateAggregateUptime(259200); // All time/Monthly

  // Grouping Logic
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  const groupedServices: Record<string, Service[]> = {};
  
  // Initialize groups
  sortedGroups.forEach(g => groupedServices[g.id] = []);
  groupedServices['ungrouped'] = [];

  // Distribute services
  services.forEach(service => {
    // Apply Category Filter first
    if (activeCategory !== 'All' && activeCategory !== 'Speed Test' && service.category !== activeCategory) return;

    if (service.groupId && groupedServices[service.groupId]) {
      groupedServices[service.groupId].push(service);
    } else {
      groupedServices['ungrouped'].push(service);
    }
  });

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-24 md:pb-12">
      
      {/* System Announcement Banner */}
      {announcement && announcement.isActive && (
        <div className={`p-4 rounded-2xl border flex items-start space-x-4 shadow-lg animate-in slide-in-from-top-4 duration-500 ${
          announcement.severity === AnnouncementSeverity.CRITICAL ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20' : 
          announcement.severity === AnnouncementSeverity.WARNING ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20' : 
          'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
        }`}>
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm ${announcement.severity === AnnouncementSeverity.CRITICAL ? 'animate-pulse' : ''}`}>
             <i className={`fa-solid ${
               announcement.severity === AnnouncementSeverity.CRITICAL ? 'fa-circle-exclamation' : 
               announcement.severity === AnnouncementSeverity.WARNING ? 'fa-triangle-exclamation' : 
               'fa-circle-info'
             }`}></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wide opacity-90">
                {announcement.severity === AnnouncementSeverity.CRITICAL ? 'System Outage' : 
                 announcement.severity === AnnouncementSeverity.WARNING ? 'Service Notice' : 
                 'Maintenance Update'}
              </h3>
              <span className="text-[10px] font-mono opacity-75">{new Date(announcement.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="mt-1 font-medium text-sm leading-relaxed text-white/95">{announcement.message}</p>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={`px-6 py-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 shadow-sm ${
        globalStatus === 'OPERATIONAL' ? 'bg-emerald-500/5 border-emerald-500/20' : 
        globalStatus === 'INCIDENT' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${
            globalStatus === 'OPERATIONAL' ? 'bg-emerald-500 text-white' : 
            globalStatus === 'INCIDENT' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            <i className={`fa-solid ${globalStatus === 'OPERATIONAL' ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
          </div>
          <div>
            <h2 className={`text-lg font-bold leading-tight ${
              globalStatus === 'OPERATIONAL' ? 'text-emerald-700 dark:text-emerald-400' : 
              globalStatus === 'INCIDENT' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {globalStatus === 'OPERATIONAL' ? 'All Systems Operational' : 
               globalStatus === 'INCIDENT' ? 'Active Service Incidents' : 'Partial System Degraded'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Grid updating every 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
           <div className="hidden sm:block text-right">
              <p className="font-bold text-slate-900 dark:text-white text-xl leading-none">{globalUptime}%</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">Uptime</p>
           </div>
           <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
           <div className="text-right">
              <p className="font-bold text-slate-900 dark:text-white text-xl leading-none">{services.length}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">Nodes</p>
           </div>
        </div>
      </div>

      {services.length === 0 && activeCategory !== 'Speed Test' ? (
        <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-xl">
            <i className="fa-solid fa-snowflake text-3xl animate-pulse"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SubZero Offline</h2>
            <p className="text-slate-500 mt-2 text-sm">No monitoring nodes initialized. Configure services in the Admin Panel to begin.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeCategory === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {activeCategory !== 'Speed Test' && (
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Grid
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  List
                </button>
              </div>
            )}
          </div>

          {/* Render Content Based on Category */}
          {activeCategory === 'Speed Test' ? (
             <SpeedTest />
          ) : (
             <div className="space-y-10">
              {sortedGroups.map(group => {
                const groupServices = groupedServices[group.id];
                if (!groupServices || groupServices.length === 0) return null;

                return (
                  <section key={group.id} className="animate-in fade-in duration-500">
                    <div className="flex items-center space-x-3 mb-5 px-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{group.name}</h3>
                    </div>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6" : "space-y-3"}>
                      {groupServices.map(service => (
                         <ServiceCard key={service.id} service={service} health={healthData[service.id]} />
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Ungrouped Services */}
              {groupedServices['ungrouped'] && groupedServices['ungrouped'].length > 0 && (
                 <section className="animate-in fade-in duration-500">
                    <div className="flex items-center space-x-3 mb-5 px-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Uncategorized</h3>
                    </div>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6" : "space-y-3"}>
                      {groupedServices['ungrouped'].map(service => (
                         <ServiceCard key={service.id} service={service} health={healthData[service.id]} />
                      ))}
                    </div>
                 </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Statistical Trends Breakdown - Only show on main dashboard views */}
      {activeCategory !== 'Speed Test' && (
        <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Metrics</h3>
              <p className="text-slate-500 text-xs mt-1">Real-time stability analysis based on session history.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Hourly', val: hourlyUptime, color: 'bg-emerald-500' },
              { label: 'Daily', val: dailyUptime, color: 'bg-indigo-500' },
              { label: 'Monthly', val: monthlyUptime, color: 'bg-cyan-500' }
            ].map((metric, idx) => (
              <div key={metric.label} className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p>
                    <div className={`w-1.5 h-1.5 rounded-full ${metric.color}`}></div>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {metric.val}
                    </h4>
                    <span className="text-xs font-semibold text-slate-400">%</span>
                 </div>
                 
                 <div className="mt-4 space-y-3">
                    {services.slice(0, 3).map(s => {
                      const health = healthData[s.id];
                      const pct = health ? health.uptimePercentage : 100;
                      return (
                        <div key={s.id} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-medium">
                              <span className="text-slate-500 truncate max-w-[150px]">{s.name}</span>
                              <span className="text-slate-700 dark:text-slate-300">{pct}%</span>
                           </div>
                           <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${metric.color.replace('bg-', 'bg-')}`} style={{ width: `${pct}%` }}></div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
