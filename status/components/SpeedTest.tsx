
import React, { useState, useRef, useEffect } from 'react';

type TestState = 'idle' | 'pinging' | 'downloading' | 'uploading' | 'complete' | 'error';

const SpeedTest: React.FC = () => {
  const [state, setState] = useState<TestState>('idle');
  const [ping, setPing] = useState<number>(0);
  const [jitter, setJitter] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0); // Mbps
  const [uploadSpeed, setUploadSpeed] = useState<number>(0); // Mbps
  const [progress, setProgress] = useState<number>(0);

  // Refs for tracking live intervals
  const cancelRef = useRef<boolean>(false);

  const formatSpeed = (speed: number) => speed.toFixed(1);
  const formatLatency = (ms: number) => Math.round(ms);

  const resetTest = () => {
    setState('idle');
    setPing(0);
    setJitter(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setProgress(0);
    cancelRef.current = false;
  };

  const runTest = async () => {
    if (state !== 'idle' && state !== 'complete' && state !== 'error') return;
    
    resetTest();
    setState('pinging');

    try {
      // 1. PING & JITTER PHASE
      const pings: number[] = [];
      for (let i = 0; i < 5; i++) {
        if (cancelRef.current) return;
        const start = performance.now();
        await fetch(`/api/speedtest/ping?t=${Date.now()}`);
        const end = performance.now();
        pings.push(end - start);
        setProgress(5 + (i * 2)); // 5% to 15%
        await new Promise(r => setTimeout(r, 100)); // Small gap
      }

      const minPing = Math.min(...pings);
      const avgPing = pings.reduce((a, b) => a + b) / pings.length;
      // Calculate jitter (avg deviation)
      const jitterCalc = pings.reduce((acc, curr) => acc + Math.abs(curr - avgPing), 0) / pings.length;

      setPing(minPing);
      setJitter(jitterCalc);
      
      // 2. DOWNLOAD PHASE
      setState('downloading');
      
      // Adaptive Download:
      // Start with small chunk (2MB) to gauge speed
      const warmUpSize = 2 * 1024 * 1024;
      const warmUpStart = performance.now();
      await fetchWithProgress(warmUpSize, 'download', (pct, mbps) => {
         setDownloadSpeed(mbps);
         setProgress(15 + (pct * 0.05)); // 15-20%
      });
      const warmUpDuration = (performance.now() - warmUpStart) / 1000;
      
      // Calculate target size for main test (aim for ~5 seconds of download)
      // Estimated Bps = warmUpSize / duration
      // Target Bytes = Estimated Bps * 5
      const estimatedBps = warmUpSize / warmUpDuration;
      let targetBytes = Math.floor(estimatedBps * 5);
      // Clamp target: Min 5MB, Max 100MB to save bandwidth
      targetBytes = Math.max(5 * 1024 * 1024, Math.min(100 * 1024 * 1024, targetBytes));
      
      // Run Main Download
      await fetchWithProgress(targetBytes, 'download', (pct, mbps) => {
         setDownloadSpeed(mbps);
         setProgress(20 + (pct * 0.4)); // 20-60%
      });

      // 3. UPLOAD PHASE
      setState('uploading');
      
      // Generate Payload (Reuse buffer to avoid memory spike)
      // For upload, we use XHR because Fetch doesn't support upload progress well yet
      const uploadSize = Math.floor(targetBytes * 0.5); // Upload 50% of download size (usually slower)
      const uploadPayload = new Uint8Array(uploadSize).fill(1); // Dummy data
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const start = performance.now();
        
        xhr.upload.addEventListener("progress", (evt) => {
          if (cancelRef.current) {
            xhr.abort();
            reject('cancelled');
            return;
          }
          if (evt.lengthComputable) {
            const duration = (performance.now() - start) / 1000;
            const mbps = (evt.loaded * 8) / (duration * 1000 * 1000);
            setUploadSpeed(mbps);
            
            // Map 0-100% of upload to 60-100% of total progress
            const totalProgress = 60 + ((evt.loaded / evt.total) * 40);
            setProgress(totalProgress);
          }
        });

        xhr.addEventListener("load", () => resolve());
        xhr.addEventListener("error", () => reject('upload failed'));
        xhr.addEventListener("abort", () => reject('cancelled'));
        
        xhr.open("POST", "/api/speedtest/upload");
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(uploadPayload);
      });

      setState('complete');
      setProgress(100);

    } catch (e) {
      if (e !== 'cancelled') {
        console.error(e);
        setState('error');
      }
    }
  };

  // Helper for Download Stream
  const fetchWithProgress = async (bytes: number, type: 'download', onProgress: (pct: number, mbps: number) => void) => {
    const response = await fetch(`/api/speedtest/download?bytes=${bytes}`);
    if (!response.body) return;
    
    const reader = response.body.getReader();
    let receivedLength = 0;
    const startTime = performance.now();
    
    while(true) {
      if (cancelRef.current) {
        reader.cancel();
        throw 'cancelled';
      }
      
      const { done, value } = await reader.read();
      if (done) break;
      
      receivedLength += value.length;
      
      const duration = (performance.now() - startTime) / 1000;
      // bits loaded / seconds / mega
      const mbps = (receivedLength * 8) / (duration * 1000 * 1000);
      const pct = (receivedLength / bytes) * 100;
      
      onProgress(pct, mbps);
    }
  };

  const cancelTest = () => {
    cancelRef.current = true;
    setState('idle');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-in fade-in zoom-in duration-300">
      
      <div className="w-full max-w-4xl text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Network Link Analysis
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Measure the connection quality between your device and this server.
        </p>
      </div>

      {/* Main Speed Gauge / Action Area */}
      <div className="relative mb-12">
        {/* Background Circle */}
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-slate-100 dark:border-white/5 flex items-center justify-center relative bg-white dark:bg-slate-900 shadow-2xl">
          
          {/* Progress Arc (Simplified with conic gradient for visual effect) */}
          <div 
             className="absolute inset-0 rounded-full transition-all duration-300"
             style={{
               background: `conic-gradient(from 0deg, #6366f1 ${progress}%, transparent ${progress}%)`,
               maskImage: 'radial-gradient(closest-side, transparent 88%, black 90%)',
               WebkitMaskImage: 'radial-gradient(closest-side, transparent 88%, black 90%)',
               transform: 'rotate(0deg)',
               opacity: state === 'idle' ? 0 : 1
             }}
          ></div>

          <div className="flex flex-col items-center justify-center z-10 relative">
             {state === 'idle' || state === 'complete' || state === 'error' ? (
                <button 
                  onClick={runTest}
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex flex-col items-center justify-center shadow-lg hover:shadow-indigo-500/40 hover:scale-105 transition-all group"
                >
                   <i className={`fa-solid ${state === 'error' ? 'fa-triangle-exclamation' : 'fa-play'} text-3xl mb-2 group-hover:scale-110 transition-transform`}></i>
                   <span className="font-bold text-lg tracking-wider uppercase">
                      {state === 'idle' ? 'Start' : state === 'error' ? 'Retry' : 'Test Again'}
                   </span>
                </button>
             ) : (
                <div className="text-center">
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                     {state === 'pinging' ? 'Analyzing Latency' : state === 'downloading' ? 'Downloading...' : 'Uploading...'}
                   </p>
                   <div className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                      {state === 'pinging' ? Math.round(ping) || '--' : 
                       state === 'downloading' ? formatSpeed(downloadSpeed) : 
                       formatSpeed(uploadSpeed)}
                   </div>
                   <p className="text-sm font-bold text-indigo-500 uppercase mt-1">
                      {state === 'pinging' ? 'ms' : 'Mbps'}
                   </p>
                </div>
             )}
          </div>
        </div>
        
        {/* Cancel Button */}
        {(state === 'downloading' || state === 'uploading' || state === 'pinging') && (
          <button 
            onClick={cancelTest}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-slate-400 hover:text-rose-500 text-sm font-semibold transition-colors"
          >
            Cancel Test
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl">
        
        {/* Ping Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-500 ${
           state === 'pinging' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5'
        }`}>
           <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                 <i className="fa-solid fa-stopwatch text-sm"></i>
              </div>
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ping</span>
           </div>
           <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold ${ping ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                {ping ? formatLatency(ping) : '--'}
              </span>
              <span className="text-xs font-bold text-slate-400">ms</span>
           </div>
           {jitter > 0 && <p className="text-[10px] text-slate-400 mt-1 font-mono">Jitter: {formatLatency(jitter)}ms</p>}
        </div>

        {/* Download Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-500 ${
           state === 'downloading' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5'
        }`}>
           <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                 <i className="fa-solid fa-arrow-down text-sm"></i>
              </div>
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Download</span>
           </div>
           <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold ${downloadSpeed ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                {downloadSpeed ? formatSpeed(downloadSpeed) : '--'}
              </span>
              <span className="text-xs font-bold text-slate-400">Mbps</span>
           </div>
        </div>

        {/* Upload Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-500 ${
           state === 'uploading' ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5'
        }`}>
           <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                 <i className="fa-solid fa-arrow-up text-sm"></i>
              </div>
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Upload</span>
           </div>
           <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold ${uploadSpeed ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                {uploadSpeed ? formatSpeed(uploadSpeed) : '--'}
              </span>
              <span className="text-xs font-bold text-slate-400">Mbps</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default SpeedTest;
