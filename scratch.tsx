            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Admin Warning */}
                    {sessionInfo.session.isAdmin && (
                        <div className="bg-plex/5 border border-plex/20 rounded-2xl p-6 text-sm text-muted leading-relaxed shadow-lg">
                            <span className="text-plex font-bold">Server Administrator</span> — You own this server. Use the Admin Panel to manage users and settings. Your personal watch stats will appear below if you switch to a normal user account.
                        </div>
                    )}

                    {/* Trial setup / Subscription Status */}
                    {!sessionInfo.session.isAdmin && !user && (
                        <div className="flex items-center gap-3 text-muted text-sm bg-card p-6 rounded-2xl border border-border shadow-lg">
                            <div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin flex-shrink-0" />
                            Setting up your 3-Day Free Trial...
                        </div>
                    )}

                    {!sessionInfo.session.isAdmin && user && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-3">Subscription Status</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border uppercase tracking-wider shadow-sm ${isRevoked ? 'bg-red-500/10 border-red-500/30 text-red-400' : isExpiringSoon ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                            <span className={`w-2 h-2 rounded-full animate-pulse ${isRevoked ? 'bg-red-400' : isExpiringSoon ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                            {user.plexAccessStatus}{user.isTrial && ' · Trial'}
                                        </span>
                                        {user.expiryDate ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-text shadow-sm">
                                                <Calendar size={14} className="text-muted" />
                                                {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400 shadow-sm">
                                                ♾️ Unlimited Access
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {isRevoked && daysLeft !== null && daysLeft >= 0 && (
                                    <button className="w-full mt-2 px-6 py-2.5 bg-plex text-background rounded-xl font-bold hover:bg-plex-hover transition-colors shadow-lg" onClick={handleRelink}>
                                        Re-link Plex Account
                                    </button>
                                )}

                                {daysLeft !== null && (
                                    <div className="bg-background/40 rounded-xl p-5 border border-white/5 mt-2">
                                        <div className="flex justify-between items-baseline mb-3">
                                            <span className="text-muted text-xs uppercase tracking-widest font-semibold">Time Remaining</span>
                                            <span className={`font-black text-3xl md:text-4xl leading-none ${isExpiringSoon ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]' : 'text-plex drop-shadow-[0_0_8px_rgba(229,160,13,0.3)]'}`}>
                                                {daysLeft}<span className="text-base font-semibold text-muted ml-1.5">{daysLeft === 1 ? 'day' : 'days'}</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                                            <div className={`h-full rounded-full transition-all duration-1000 relative ${isExpiringSoon ? 'bg-yellow-400' : 'bg-gradient-to-r from-plex via-amber-400 to-orange-500'}`} style={{ width: `${progressPct}%` }}>
                                                <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
                                            </div>
                                        </div>
                                        {isExpiringSoon && <p className="text-yellow-400/90 text-sm font-medium mt-3 flex items-center gap-2">⚠️ Expiring soon — contact admin</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Announcement Banner */}
                    {publicConfig?.announcement && (
                        <div className="bg-plex/10 border border-plex/30 rounded-2xl p-4 md:p-6 shadow-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">📢</span>
                                <div>
                                    <h3 className="text-plex font-bold text-sm uppercase tracking-wider mb-1">Announcement</h3>
                                    <p className="text-text whitespace-pre-wrap text-sm leading-relaxed">{publicConfig.announcement}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Referral Link */}
                    {publicConfig?.referralEnabled && user && !sessionInfo.session.isAdmin && (
                        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg">
                            <p className="text-plex font-bold text-base mb-1">🎁 Invite Friends</p>
                            <p className="text-muted text-sm leading-relaxed mb-4">Share this link. They get a free trial, and you get reward days!</p>
                            <div className="flex flex-col gap-2">
                                <input type="text" readOnly value={`${window.location.origin}/?ref=${user.id}`} className="w-full p-3 rounded-lg border border-border bg-background text-text text-sm outline-none" />
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`); setToast({ id: 99, message: 'Copied to clipboard!', type: 'success' }); }} className="w-full py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors shadow-md">Copy Link</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Server Stats Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden h-full min-h-[200px]">
                        <div className="absolute -top-10 -right-10 p-8 opacity-5">
                            <Activity className="w-64 h-64 text-plex" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-muted text-sm uppercase tracking-widest font-semibold mb-6">Server Library Size</p>
                            {serverDataLoading ? (
                                <div className="flex gap-3 items-center text-muted"><div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin" /> Fetching latest library sizes...</div>
                            ) : serverStats ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-background/60 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Film className="w-8 h-8 text-plex mb-3 opacity-80" />
                                        <span className="text-4xl font-black text-text drop-shadow-md">{serverStats.movies?.toLocaleString() || 0}</span>
                                        <span className="text-xs text-muted uppercase font-bold tracking-wider mt-2">Movies</span>
                                    </div>
                                    <div className="bg-background/60 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Tv className="w-8 h-8 text-plex mb-3 opacity-80" />
                                        <span className="text-4xl font-black text-text drop-shadow-md">{serverStats.shows?.toLocaleString() || 0}</span>
                                        <span className="text-xs text-muted uppercase font-bold tracking-wider mt-2">Episodes</span>
                                    </div>
                                    <div className="bg-background/60 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Music className="w-8 h-8 text-plex mb-3 opacity-80" />
                                        <span className="text-4xl font-black text-text drop-shadow-md">{serverStats.music?.toLocaleString() || 0}</span>
                                        <span className="text-xs text-muted uppercase font-bold tracking-wider mt-2">Tracks</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted text-sm bg-background/50 p-4 rounded-xl border border-white/5">Could not load server statistics at this time.</div>
                            )}
                        </div>
                    </div>

                    {/* User Analytics Section */}
                    {!sessionInfo.session.isAdmin && user && (
                        <>
                            {analyticsLoading ? (
                                <div className="flex items-center justify-center p-8 bg-card border border-border rounded-2xl shadow-lg">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border-2 border-plex border-t-transparent animate-spin" />
                                        <span className="text-muted text-sm font-medium">Loading your stats...</span>
                                    </div>
                                </div>
                            ) : analytics && analytics.totalPlays > 0 ? (
                                <div className="flex flex-col gap-6">
                                    
                                    {/* Top Content Grid */}
                                    {analytics.topContent && analytics.topContent.length > 0 && (
                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-text mb-1">Your Most Watched</h3>
                                                    <p className="text-muted text-sm">Based on your {analytics.totalPlays} total plays</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {analytics.topContent.slice(0, 3).map((item: any) => (
                                                    <a key={item.key} href={item.plexUrl} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform hover:scale-105 hover:shadow-xl hover:border-plex/50">
                                                        {item.thumbUrl ? (
                                                            <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-60" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                                <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                                            <p className="text-xs font-bold text-white truncate text-shadow-sm">{item.title}</p>
                                                            <p className="text-[10px] text-plex font-black mt-0.5 uppercase tracking-wider">{item.plays} plays</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent History */}
                                    {analytics.recentHistory && analytics.recentHistory.length > 0 && (
                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                                            <h3 className="text-xl font-bold text-text mb-6">Recently Watched</h3>
                                            <div className="flex flex-col gap-4">
                                                {analytics.recentHistory.slice(0, 3).map((item: any, idx: number) => (
                                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0 shadow-md">
                                                            {item.thumbUrl ? (
                                                                <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <PlaySquare className="w-6 h-6 text-muted/50" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-text text-sm truncate group-hover:text-plex transition-colors">{item.title}</h4>
                                                            {item.episodeTitle && <p className="text-muted text-xs truncate mt-0.5">{item.episodeTitle}</p>}
                                                            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted/70">
                                                                <Clock size={12} />
                                                                <span>{new Date(item.viewedAt * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-10 bg-card border border-border rounded-2xl shadow-lg text-center h-full min-h-[200px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl shadow-inner">🍿</div>
                                    <h3 className="font-bold text-text mb-2">No watch history yet</h3>
                                    <p className="text-muted text-sm max-w-sm">Once you start watching content on the server, your personal watch stats and history will appear right here!</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Recently Added Section (Full Width below Grid) */}
            {dashboardData && (
                <div className="flex flex-col gap-6 w-full mt-4">
                    {dashboardData.recentMovies?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden w-full">
                            <h3 className="text-xl font-bold text-text mb-4">Recently Added Movies</h3>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                {dashboardData.recentMovies.map((item: any, idx: number) => (
                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="snap-start shrink-0 w-32 md:w-40 group relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform hover:scale-105 hover:shadow-xl hover:border-plex/50">
                                        {item.thumb ? (
                                            <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-60" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                            <p className="text-xs font-bold text-white truncate text-shadow-sm">{item.title}</p>
                                            {item.year && <p className="text-[10px] text-gray-300 mt-0.5">{item.year}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {dashboardData.recentShows?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden w-full">
                            <h3 className="text-xl font-bold text-text mb-4">Recently Added TV Shows</h3>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                {dashboardData.recentShows.map((item: any, idx: number) => (
                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="snap-start shrink-0 w-32 md:w-40 group relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform hover:scale-105 hover:shadow-xl hover:border-plex/50">
                                        {item.thumb ? (
                                            <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-60" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                            <p className="text-xs font-bold text-white truncate text-shadow-sm">{item.title}</p>
                                            {item.year && <p className="text-[10px] text-gray-300 mt-0.5">{item.year}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
