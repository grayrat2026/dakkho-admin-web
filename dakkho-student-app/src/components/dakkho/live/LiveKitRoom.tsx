'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, Track, Participant, RemoteParticipant, RemoteTrack } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Users, MessageSquare, X } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

interface LiveKitRoomProps {
  token: string;
  url: string;
  roomName: string;
  title: string;
  onLeave: () => void;
}

export function LiveKitRoomView({ token, url, roomName, title, onLeave }: LiveKitRoomProps) {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const connect = useCallback(async () => {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480, frameRate: 15 },
        },
      });

      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (_track: Track, pub: any, participant: Participant) => {
        updateParticipants();
      });

      room.on(RoomEvent.TrackUnsubscribed, (_track: Track, pub: any, participant: Participant) => {
        updateParticipants();
      });

      room.on(RoomEvent.ParticipantConnected, () => updateParticipants());
      room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants());

      await room.connect(url, token);
      setConnected(true);

      // Publish audio by default
      await room.localParticipant.setAudioEnabled(true);

      // Attach local video if enabled
      if (localVideoRef.current) {
        const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
        if (camTrack && localVideoRef.current) {
          (camTrack as any).attach(localVideoRef.current);
        }
      }

      updateParticipants();
    } catch (err: any) {
      console.error('LiveKit connection error:', err);
      setError(err?.message || 'Failed to connect to live class');
    }
  }, [token, url]);

  const updateParticipants = () => {
    const room = roomRef.current;
    if (!room) return;
    const all = Array.from(room.remoteParticipants.values());
    setParticipants(all);
  };

  useEffect(() => {
    connect();
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [connect]);

  // Attach remote video tracks to video elements
  useEffect(() => {
    if (!roomRef.current) return;

    const room = roomRef.current;
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((pub) => {
        if (pub.track && pub.source === Track.Source.Camera) {
          const el = videoRefs.current.get(participant.identity);
          if (el) {
            (pub.track as any).attach(el);
          }
        }
      });
    });
  }, [participants]);

  const toggleAudio = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setAudioEnabled(!localAudioEnabled);
    setLocalAudioEnabled(!localAudioEnabled);
  };

  const toggleVideo = async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = !localVideoEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setLocalVideoEnabled(enabled);

    if (enabled && localVideoRef.current) {
      const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
      if (camTrack) {
        (camTrack as any).attach(localVideoRef.current);
      }
    }
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnected(false);
    onLeave();
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/15 flex items-center justify-center">
            <PhoneOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Connection Failed</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <GradientButton onClick={onLeave} variant="danger">Close</GradientButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#141428] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">{title}</h1>
          <span className="text-xs text-muted-foreground">Dakkho Live</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06]">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{participants.length + 1}</span>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 text-red-500 text-xs font-semibold hover:bg-red-500/25 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {!connected ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Connecting to live class...</p>
          </div>
        ) : (
          <div className="w-full h-full grid gap-3" style={{
            gridTemplateColumns: participants.length === 0 ? '1fr' : participants.length <= 2 ? 'repeat(auto-fit, minmax(300px, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))',
          }}>
            {/* Local participant (small tile) */}
            <div className="relative rounded-xl overflow-hidden bg-[#1a1a3a] border border-white/[0.06] aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!localVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a3a]">
                  <div className="w-14 h-14 rounded-full bg-sky-500/15 flex items-center justify-center">
                    <span className="text-sky-500 text-lg font-bold">You</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white">
                You {!localAudioEnabled && '(Muted)'}
              </div>
            </div>

            {/* Remote participants */}
            {participants.map((participant) => (
              <div key={participant.identity} className="relative rounded-xl overflow-hidden bg-[#1a1a3a] border border-white/[0.06] aspect-video">
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(participant.identity, el);
                      // Attach track if available
                      const camPub = participant.getTrackPublication(Track.Source.Camera);
                      if (camPub?.track) {
                        (camPub.track as any).attach(el);
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white">
                  {participant.name || participant.identity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 bg-[#141428] border-t border-white/[0.06]">
        <motion.button
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            localAudioEnabled ? 'bg-white/[0.08] text-foreground' : 'bg-red-500/20 text-red-500'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {localAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </motion.button>

        <motion.button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            localVideoEnabled ? 'bg-white/[0.08] text-foreground' : 'bg-red-500/20 text-red-500'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {localVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </motion.button>

        <motion.button
          onClick={leaveRoom}
          className="w-14 h-12 rounded-full bg-red-500 text-white flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PhoneOff className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
