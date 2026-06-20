
import React, { useState } from 'react';
import { Service, ServiceType, SystemAnnouncement, AnnouncementSeverity, Group } from '../types';
import { CATEGORIES, SERVICE_PRESETS } from '../constants';

interface AdminPanelProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  announcement: SystemAnnouncement | null;
  setAnnouncement: React.Dispatch<React.SetStateAction<SystemAnnouncement | null>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

interface MaintenanceTask {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'idle' | 'running' | 'success';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ services, setServices, announcement, setAnnouncement, groups, setGroups }) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'groups'>('nodes');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Group Management State
  const [groupName, setGroupName] = useState('');

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    { id: 'db-opt', name: 'Optimize Library', icon: 'fa-database', description: 'Compress local SQLite databases.', status: 'idle' },
    { id: 'clean-bundles', name: 'Purge Artifacts', icon: 'fa-broom', description: 'Remove stale metadata buffers.', status: 'idle' },
    { id: 'refresh-metadata', name: 'Global Re-Sync', icon: 'fa-rotate', description: 'Force metadata refresh.', status: 'idle' },
    { id: 'scan-libs', name: 'Deep Scan', icon: 'fa-magnifying-glass', description: 'Trigger library analysis.', status: 'idle' },
  ]);

  const [speedTest, setSpeedTest] = useState<{
    status: 'idle' | 'running' | 'complete' | 'error';
    ping: number;
    download: number;
    progress: number;
  }>({ status: 'idle', ping: 0, download: 0, progress: 0 });

  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    url: '',
    port: '',
    category: 'Media',
    groupId: '',
    type: ServiceType.LOCAL,
    description: '',
    isCritical: false
  });

  const [announcementForm, setAnnouncementForm] = useState({
    message: announcement?.message || '',
    severity: announcement?.severity || AnnouncementSeverity.CRITICAL
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 5));
  };

  const testConnection = async () => {
    if (!formData.url) return;
    setTestStatus('testing');
    const fullUrl = formData.type === ServiceType.LOCAL && formData.port ? `${formData.url}:${formData.port}` : formData.url;
    
    try {
      try {
        const res = await fetch(fullUrl, { method: 'GET', cache: 'no-store' });
        if (res.ok) {
           setTestStatus('success');
        } else {
           setTestStatus('fail');
        }
      } catch (corsErr) {
        await fetch(fullUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
        setTestStatus('success');
      }
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e) {
      setTestStatus('fail');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const runTask = (id: string) => {
    setMaintenanceTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));
    const task = maintenanceTasks.find(t => t.id === id);
    addLog(`Initiating ${task?.name}...`);

    setTimeout(() => {
      setMaintenanceTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'success' } : t));
      addLog(`${task?.name} complete.`);
      setTimeout(() => {
        setMaintenanceTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'idle' } : t));
      }, 3000);
    }, 2000);
  };

  const runSpeedTest = async () => {
    if (speedTest.status === 'running') return;
    
    setSpeedTest({ status: 'running', ping: 0, download: 0, progress: 5 });
    addLog('Initializing Network Uplink Test...');

    try {
      const startPing = performance.now();
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
      const endPing = performance.now();
      const ping = Math.round(endPing - startPing);
      setSpeedTest(prev => ({ ...prev, ping, progress: 30 }));
      addLog(`Latency check complete: ${ping}ms`);

      const sizeBytes = 5 * 1024 * 1024;
      const dlStart = performance.now();
      
      const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${sizeBytes}`);
      if (!response.ok) throw new Error('Network response was not ok');
      await response.blob(); 
      
      const dlEnd = performance.now();
      const durationSec = (dlEnd - dlStart) / 1000;
      const bitsLoaded = sizeBytes * 8;
      const mbps = bitsLoaded / durationSec / (1024 * 1024);

      setSpeedTest({ 
        status: 'complete', 
        ping, 
        download: parseFloat(mbps.toFixed(1)), 
        progress: 100 
      });
      addLog(`Downlink analysis complete: ${mbps.toFixed(1)} Mbps`);

    } catch (error) {
      console.error(error);
      addLog('Uplink Test Failed: CORS/Network Error');
      setSpeedTest(prev => ({ ...prev, status: 'error', progress: 0 }));
    }
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(services, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "subzero_config_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog('Configuration backup exported.');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;

    if (editingId) {
      // Update existing
      setServices(prev => prev.map(s => s.id === editingId ? {
        ...s,
        name: formData.name!,
        url: formData.url!,
        port: formData.type === ServiceType.LOCAL ? formData.port : undefined,
        category: formData.category || 'Media',
        groupId: formData.groupId,
        type: formData.type || ServiceType.LOCAL,
        description: formData.description,
        isCritical: formData.isCritical
      } : s));
      addLog(`Node Updated: ${formData.name}`);
    } else {
      // Add new
      const newService: Service = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Unknown Node',
        url: formData.url || '',
        port: formData.type === ServiceType.LOCAL ? formData.port : undefined,
        category: formData.category || 'Media',
        groupId: formData.groupId,
        type: formData.type || ServiceType.LOCAL,
        description: formData.description,
        isCritical: formData.isCritical
      };
      setServices(prev => [...prev, newService]);
      addLog(`Node Deployed: ${newService.name}`);
    }

    setIsAdding(false);
    resetForm();
  };

  const handleEditService = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      url: service.url,
      port: service.port || '',
      category: service.category,
      groupId: service.groupId || '',
      type: service.type,
      description: service.description || '',
      isCritical: service.isCritical
    });
    setTestStatus('idle');
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', port: '', category: 'Media', groupId: '', type: ServiceType.LOCAL, description: '', isCritical: false });
    setTestStatus('idle');
    setEditingId(null);
  };

  const triggerPresetConfig = (preset: Partial<Service>) => {
    setFormData({
      ...formData,
      name: preset.name,
      url: preset.url || 'http://127.0.0.1',
      port: preset.port || '',
      category: preset.category || 'Media',
      groupId: preset.groupId || '',
      type: preset.type || ServiceType.LOCAL,
      description: preset.description || '',
      isCritical: false
    });
    setEditingId(null);
    setIsAdding(true);
  };

  const removeService = (id: string) => {
    const service = services.find(s => s.id === id);
    if (window.confirm('Decommission this node? Monitoring will cease immediately.')) {
      setServices(prev => prev.filter(s => s.id !== id));
      addLog(`Node Offline: ${service?.name}`);
    }
  };

  const toggleCritical = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isCritical: !s.isCritical } : s));
  };

  const moveService = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === services.length - 1) return;

    setServices(prev => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    });
  };

  const handlePostAnnouncement = () => {
    if (!announcementForm.message) return;
    setAnnouncement({
      message: announcementForm.message,
      severity: announcementForm.severity,
      isActive: true,
      timestamp: Date.now()
    });
    addLog('System Announcement Broadcasted.');
  };

  const handleClearAnnouncement = () => {
    setAnnouncement(null);
    setAnnouncementForm({ message: '', severity: AnnouncementSeverity.CRITICAL });
    addLog('Announcement Cleared.');
  };

  // Group Management Functions
  const handleAddGroup = () => {
    if (!groupName) return;
    const newGroup: Group = {
      id: Math.random().toString(36).substr(2, 9),
      name: groupName,
      order: groups.length
    };
    setGroups([...groups, newGroup]);
    setGroupName('');
    addLog(`Group Created: ${newGroup.name}`);
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Delete this group? Services will become ungrouped.')) {
      setGroups(groups.filter(g => g.id !== id));
      setServices(services.map(s => s.groupId === id ? { ...s, groupId: undefined } : s));
    }
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
     if (direction === 'up' && index === 0) return;
     if (direction === 'down' && index === groups.length - 1) return;
     
     const newGroups = [...groups];
     const targetIndex = direction === 'up' ? index - 1 : index + 1;
     
     // Swap order values
     const tempOrder = newGroups[index].order;
     newGroups[index].order = newGroups[targetIndex].order;
     newGroups[targetIndex].order = tempOrder;
     
     // Swap position in array
     [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
     setGroups(newGroups);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Administration</h2>
          <p className="text-slate-500 text-sm mt-1">Configure Infrastructure Grid & Health Probes.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportConfig}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-download"></i>
            <span className="hidden sm:inline">Backup</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2 text-white"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Node</span>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
           {/* Announcement Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">System Announcement</h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: AnnouncementSeverity.CRITICAL, label: 'Critical Outage', color: 'bg-rose-500 border-rose-600' },
                  { val: AnnouncementSeverity.WARNING, label: 'Partial Service', color: 'bg-amber-500 border-amber-600' },
                  { val: AnnouncementSeverity.INFO, label: 'Maintenance / Info', color: 'bg-emerald-500 border-emerald-600' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setAnnouncementForm(prev => ({ ...prev, severity: opt.val }))}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      announcementForm.severity === opt.val 
                      ? `${opt.color} text-white shadow-md scale-[1.02]` 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <textarea 
                placeholder="Enter public announcement message..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-semibold resize-none"
                value={announcementForm.message}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePostAnnouncement}
                  disabled={!announcementForm.message}
                  className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Broadcast
                </button>
                {announcement && (
                  <button 
                    onClick={handleClearAnnouncement}
                    className="px-6 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-xs font-bold uppercase transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Group Management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Manage Groups</h3>
            </div>
            
            <div className="flex space-x-3 mb-6">
              <input 
                 type="text" 
                 placeholder="New Group Name" 
                 value={groupName}
                 onChange={e => setGroupName(e.target.value)}
                 className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              />
              <button 
                onClick={handleAddGroup}
                disabled={!groupName}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                Create
              </button>
            </div>

            <div className="space-y-2">
              {groups.sort((a,b) => a.order - b.order).map((group, index) => (
                <div key={group.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                   <div className="flex items-center space-x-3">
                     <span className="text-slate-400 font-mono text-[10px] w-4">{index + 1}</span>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                      <button onClick={() => moveGroup(index, 'up')} disabled={index === 0} className="w-6 h-6 rounded bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-indigo-500 disabled:opacity-30">
                        <i className="fa-solid fa-chevron-up text-[10px]"></i>
                      </button>
                      <button onClick={() => moveGroup(index, 'down')} disabled={index === groups.length - 1} className="w-6 h-6 rounded bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-indigo-500 disabled:opacity-30">
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </button>
                      <button onClick={() => handleDeleteGroup(group.id)} className="w-6 h-6 rounded bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Presets Block */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-6">Service Presets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICE_PRESETS.map((preset, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/5 shadow-sm">
                      <i className={`fa-solid ${preset.name?.toLowerCase().includes('plex') ? 'fa-play' : preset.name?.toLowerCase().includes('tmdb') ? 'fa-film' : 'fa-snowflake'}`}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200 leading-tight">{preset.name}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{preset.category}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => triggerPresetConfig(preset)}
                    className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Network Diagnostics Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Telemetry</h3>
              <div className={`w-2 h-2 rounded-full ${speedTest.status === 'running' ? 'bg-emerald-500 animate-ping' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5"></div>
                 <div className={`absolute inset-0 rounded-full border-t-4 border-emerald-500 transition-all duration-1000 ${speedTest.status === 'running' ? 'animate-spin' : ''}`} style={{ opacity: speedTest.status === 'idle' ? 0.3 : 1 }}></div>
                 
                 <div className="text-center">
                   <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">
                     {speedTest.download > 0 ? speedTest.download : '--'}
                   </h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Mbps</p>
                 </div>
              </div>

              <button 
                onClick={runSpeedTest}
                disabled={speedTest.status === 'running'}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wide hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {speedTest.status === 'running' ? 'Testing...' : 'Start Test'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Terminal</h3>
            <div className="space-y-2 font-mono text-[10px] max-h-40 overflow-y-auto scrollbar-hide">
              {logs.length === 0 ? (
                <p className="text-slate-300 dark:text-slate-700 italic">Ready...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-slate-500 dark:text-slate-400 flex items-start space-x-2 animate-in slide-in-from-left-1 duration-200">
                    <span className="text-indigo-500 font-bold">❯</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Registry Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden transition-colors shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Active Nodes</h3>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{services.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Group</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              {services.map((service, index) => (
                <tr key={service.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <i className={`fa-solid ${service.type === ServiceType.LOCAL ? 'fa-server text-xs' : 'fa-cloud text-xs'}`}></i>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-200 block">{service.name}</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 block">{service.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                      service.type === ServiceType.LOCAL ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400' : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400'
                    }`}>
                      {service.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {groups.find(g => g.id === service.groupId)?.name || 'Ungrouped'}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => moveService(index, 'up')}
                          disabled={index === 0}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <i className="fa-solid fa-chevron-up text-[10px]"></i>
                        </button>
                        <button 
                          onClick={() => moveService(index, 'down')}
                          disabled={index === services.length - 1}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <i className="fa-solid fa-chevron-down text-[10px]"></i>
                        </button>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditService(service)}
                      className="text-slate-400 hover:text-indigo-500 transition-colors p-2 mr-2"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      onClick={() => removeService(service.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Initialization Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Node' : 'Add Node'}</h3>
              </div>
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topology</label>
                <div className="flex space-x-3">
                  {(['local', 'external'] as const).map(t => (
                    <button 
                      key={t} type="button"
                      onClick={() => {
                        setFormData({...formData, type: t as any, url: '', port: ''});
                        setTestStatus('idle');
                      }}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.type === t ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-600 dark:text-white dark:border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {t === 'local' ? 'Internal' : 'External'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input 
                    autoFocus required type="text" placeholder="e.g. Plex"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-semibold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Tag</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-semibold appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Group (Section)</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-semibold appearance-none"
                  value={formData.groupId}
                  onChange={e => setFormData({...formData, groupId: e.target.value})}
                >
                  <option value="" className="bg-white dark:bg-slate-900">Ungrouped</option>
                  {groups.sort((a,b) => a.order - b.order).map(g => <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900">{g.name}</option>)}
                </select>
              </div>

              <div className={`grid ${formData.type === ServiceType.LOCAL ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
                <div className={`${formData.type === ServiceType.LOCAL ? 'col-span-2' : ''} space-y-1.5`}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {formData.type === ServiceType.LOCAL ? 'IP Address' : 'URL'}
                  </label>
                  <div className="relative">
                    <input 
                      required type="text" 
                      placeholder={formData.type === ServiceType.LOCAL ? '192.168.1.5' : 'https://example.com'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-mono"
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={testConnection}
                      className={`absolute right-2 top-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                        testStatus === 'idle' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 
                        testStatus === 'testing' ? 'bg-slate-200 text-slate-500' :
                        testStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {testStatus === 'idle' ? 'Test' : testStatus === 'testing' ? '...' : testStatus === 'success' ? 'OK' : 'Err'}
                    </button>
                  </div>
                </div>
                {formData.type === ServiceType.LOCAL && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Port</label>
                    <input 
                      type="text" placeholder="32400"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-mono"
                      value={formData.port}
                      onChange={e => setFormData({...formData, port: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setFormData({...formData, isCritical: !formData.isCritical})}>
                 <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${formData.isCritical ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600'}`}>
                    {formData.isCritical && <i className="fa-solid fa-check text-xs"></i>}
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-900 dark:text-white">Critical Infrastructure</p>
                   <p className="text-[10px] text-slate-500">Pin to top of dashboard as priority service.</p>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-sm"
              >
                {editingId ? 'Update Node Configuration' : 'Confirm & Initialize'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
