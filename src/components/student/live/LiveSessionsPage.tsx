'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Bell, PlayCircle, Users, Calendar, Clock, Video, AlertCircle, Loader2, ArrowLeft, MessageSquare, Hand, Mic, MicOff, Camera, CameraOff, ScreenShare, PhoneOff, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';
import { liveClassApi, type LiveClass, type LiveClassJoinResponse } from '@/lib/student-api-client';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  ParticipantTile,
  TrackToggle,
  DisconnectButton,
  FocusLayout,
  GridLayout,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent, Track, ConnectionState } from 'livekit-client';

// ─── LiveKit Room Component ───
function LiveClassRoom({
  token,
  url,
  roomName,
  title,
  onLeave,
}: {
  token: string;
  url: string;
  roomName: string;
  title: string;
  onLeave: () => void;
}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);

  const handleConnectionStateChanged = useCallback((state: ConnectionState) => {
    setConnectionState(state);
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('LiveKit error:', err);
    setError(err.message);
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <p className="text-gray-400 text-sm max-w-md">{error}</p>
          <GradientButton onClick={onLeave}>Leave Room</GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f]">
      {/* Room Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-white font-semibold text-sm">{title}</span>
          {connectionState === ConnectionState.Connected && (
            <span className="text-xs text-emerald-400 ml-2">Connected</span>
          )}
          {connectionState === ConnectionState.Connecting && (
            <span className="text-xs text-yellow-400 ml-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
            </span>
          )}
        </div>
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
        >
          <PhoneOff className="w-3.5 h-3.5" /> Leave
        </button>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect={true}
        audio={true}
        video={true}
        onConnected={() => setConnectionState(ConnectionState.Connected)}
        onDisconnected={() => {
          setConnectionState(ConnectionState.Disconnected);
          onLeave();
        }}
        onConnectionStateChanged={handleConnectionStateChanged}
        onError={handleError}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
      >
        <div className="h-full pt-14 pb-20">
          <VideoConference />
        </div>
        <RoomAudioRenderer />
        <ControlBar
          variation="minimal"
          controls={{
            microphone: true,
            camera: true,
            screenShare: true,
            leave: true,
          }}
        />
      </LiveKitRoom>
    </div>
  );
}

// ─── Main Live Sessions Page ───
export function LiveSessionsPage() {
  const [reminders, setReminders] = useState<Set<number>>(new Set());
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningClassId, setJoiningClassId] = useState<number | null>(null);
  const [livekitState, setLivekitState] = useState<{
    token: string;
    url: string;
    roomName: string;
    title: string;
  } | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await liveClassApi.list();
      setClasses(data.liveClasses || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    // Poll every 30 seconds for live status updates
    const interval = setInterval(fetchClasses, 30000);
    return () => clearInterval(interval);
  }, [fetchClasses]);

  const toggleReminder = async (id: number) => {
    const newState = !reminders.has(id);
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    try {
      await liveClassApi.setReminder(id, newState);
    } catch {
      // Revert on error
      setReminders((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleJoin = async (cls: LiveClass) => {
    if (cls.platform === 'livekit') {
      setJoiningClassId(cls.id);
      try {
        const data = await liveClassApi.join(cls.id);
        if (data.token && data.url) {
          setLivekitState({
            token: data.token,
            url: data.url,
            roomName: data.roomName || '',
            title: cls.title,
          });
        }
      } catch (err: any) {
        alert(err?.message || 'Failed to join live class');
      } finally {
        setJoiningClassId(null);
      }
    } else {
      // For non-LiveKit platforms, open meeting URL
      if (cls.meeting_url) {
        window.open(cls.meeting_url, '_blank');
      }
    }
  };

  const handleLeaveLiveKit = () => {
    setLivekitState(null);
    fetchClasses();
  };

  // If in LiveKit room, render the room component
  if (livekitState) {
    return (
      <LiveClassRoom
        token={livekitState.token}
        url={livekitState.url}
        roomName={livekitState.roomName}
        title={livekitState.title}
        onLeave={handleLeaveLiveKit}
      />
    );
  }

  const liveSessions = classes.filter((s) => s.status === 'live');
  const upcomingSessions = classes.filter((s) => s.status === 'scheduled');
  const replaySessions = classes.filter((s) => s.status === 'completed' || s.status === 'ended');

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Starting now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Live Sessions</h1>
          <p className="text-sm text-muted-foreground">
            {liveSessions.length} live now, {upcomingSessions.length} upcoming
          </p>
        </div>
        <div className="ml-auto">
          <GradientButton size="sm" variant="ghost" onClick={fetchClasses}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </GradientButton>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && classes.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <GradientButton size="sm" onClick={fetchClasses} className="ml-auto">Retry</GradientButton>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Video className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No Live Sessions</h3>
          <p className="text-sm text-muted-foreground">There are no upcoming or live sessions at the moment. Check back later!</p>
        </GlassCard>
      )}

      {/* Live Now Section */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-500">Live Now</h2>
          </div>
          {liveSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-4 border-l-4 border-l-red-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        LIVE
                      </motion.span>
                      {session.platform === 'livekit' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500">
                          DAKKHO LIVE
                        </span>
                      )}
                      {session.course_name && (
                        <span className="text-xs text-muted-foreground">{session.course_name}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">{session.instructor_name || 'Instructor'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {session.participant_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.participant_count} watching
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <GradientButton
                    size="sm"
                    variant="danger"
                    onClick={() => handleJoin(session)}
                    disabled={joiningClassId === session.id}
                  >
                    {joiningClassId === session.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      session.platform === 'livekit' ? 'Join Live' : 'Join'
                    )}
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
          {upcomingSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + liveSessions.length) * 0.05 }}
            >
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        UPCOMING
                      </span>
                      {session.platform === 'livekit' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500">
                          DAKKHO LIVE
                        </span>
                      )}
                      {session.course_name && (
                        <span className="text-xs text-muted-foreground">{session.course_name}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">{session.instructor_name || 'Instructor'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration_minutes} min
                      </span>
                      <span className="font-semibold text-sky-500">
                        in {getTimeUntil(session.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      reminders.has(session.id)
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => toggleReminder(session.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Bell className={`w-3 h-3 ${reminders.has(session.id) ? 'fill-current' : ''}`} />
                    {reminders.has(session.id) ? 'Reminder Set' : 'Set Reminder'}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Replay Section */}
      {replaySessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Past Sessions</h2>
          {replaySessions.slice(0, 10).map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + liveSessions.length + upcomingSessions.length) * 0.05 }}
            >
              <GlassCard hover className="p-4 opacity-70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        ENDED
                      </span>
                      {session.recording_url && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          RECORDING
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">{session.instructor_name || 'Instructor'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  {session.recording_url && (
                    <motion.button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(session.recording_url, '_blank')}
                    >
                      <PlayCircle className="w-3 h-3" /> Watch Replay
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
