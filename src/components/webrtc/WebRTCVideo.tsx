import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../../hooks/useSocket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Minimize2, Volume2, VolumeX } from 'lucide-react';

interface WebRTCVideoProps {
  roomId: string;
  userId: string;
  isInitiator?: boolean;
  onCallEnd?: () => void;
}

export const WebRTCVideo = ({
  roomId,
  userId,
  isInitiator = false,
  onCallEnd,
}: WebRTCVideoProps) => {
  const { socket, isConnected } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Initialize local stream and peer connection
  useEffect(() => {
    if (!socket || !isConnected) return;

    const init = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { autoGainControl: true, noiseSuppression: true, echoCancellation: true },
        });

        localStreamRef.current = stream;

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const peer = new SimplePeer({
          initiator: isInitiator,
          trickle: true,
          stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              // Add TURN servers if configured in environment
              ...(import.meta.env.VITE_TURN_SERVER
                ? [
                    {
                      urls: import.meta.env.VITE_TURN_SERVER,
                      username: import.meta.env.VITE_TURN_USERNAME,
                      credential: import.meta.env.VITE_TURN_PASSWORD,
                    },
                  ]
                : []),
            ],
          },
        });

        peerRef.current = peer;

        // Handle peer stream
        peer.on('stream', (remoteStream) => {
          console.log('[WebRTC] Received remote stream');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setCallState('connected');
        });

        // Handle ICE candidates
        peer.on('signal', (data) => {
          if (data.type === 'offer') {
            socket.emit('webrtc-offer', {
              roomId,
              offer: data,
              from_user_id: userId,
            });
          } else if (data.type === 'answer') {
            socket.emit('webrtc-answer', {
              roomId,
              answer: data,
              from_user_id: userId,
            });
          } else if (data.candidate) {
            socket.emit('webrtc-ice-candidate', {
              roomId,
              candidate: data,
              from_user_id: userId,
            });
          }
        });

        // Handle connection errors
        peer.on('error', (err) => {
          console.error('[WebRTC] Peer error:', err);
          setCallState('failed');
        });

        // Join room
        socket.emit('join-room', roomId);

        // Listen for remote offer
        socket.on('webrtc-offer', ({ offer, from }) => {
          if (!isInitiator && peerRef.current) {
            peerRef.current.signal(offer);
          }
        });

        // Listen for remote answer
        socket.on('webrtc-answer', ({ answer, from }) => {
          if (isInitiator && peerRef.current) {
            peerRef.current.signal(answer);
          }
        });

        // Listen for ICE candidates
        socket.on('webrtc-ice-candidate', ({ candidate, from }) => {
          if (peerRef.current) {
            peerRef.current.addIceCandidate(candidate).catch((err) =>
              console.error('[WebRTC] Error adding ICE candidate:', err),
            );
          }
        });
      } catch (error) {
        console.error('[WebRTC] Initialization error:', error);
        setCallState('failed');
      }
    };

    init();

    return () => {
      // Cleanup
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [socket, isConnected, roomId, userId, isInitiator]);

  // Track call duration
  useEffect(() => {
    if (callState !== 'connected') return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle audio mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // End call
  const handleEndCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (socket) {
      socket.emit('leave-room', roomId);
    }
    onCallEnd?.();
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Remote video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        muted={false}
      />

      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-4 right-4 rounded-lg overflow-hidden border-2 border-white shadow-lg w-32 h-32 bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Status overlay */}
      {callState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            {callState === 'connecting' && (
              <>
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                <p className="text-white">Connecting...</p>
              </>
            )}
            {callState === 'failed' && (
              <>
                <p className="text-red-400 mb-4">Connection failed</p>
                <Button variant="destructive" onClick={handleEndCall}>
                  End Call
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Call duration */}
      {callState === 'connected' && (
        <div className="absolute top-4 left-4">
          <Card className="bg-black/80 text-white px-3 py-1 text-sm">
            {formatDuration(callDuration)}
          </Card>
        </div>
      )}

      {/* Call controls */}
      {callState === 'connected' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          <Button
            size="icon"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleMute}
            className="rounded-full w-12 h-12"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoOff ? <Minimize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={handleEndCall}
            className="rounded-full w-12 h-12"
          >
            End Call
          </Button>
        </div>
      )}
    </div>
  );
};
