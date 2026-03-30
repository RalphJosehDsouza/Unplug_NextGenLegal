import { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Phone,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { WebRTCVideo } from './WebRTCVideo';
import api from '@/api/axios';
import { toast } from 'sonner';

interface BookingWithCall {
  booking_id: string;
  lawyer_name: string;
  lawyer_id: string;
  call_status?: string;
  onClose?: () => void;
}

interface CallStatus {
  booking_id: string;
  call_status: string;
  scheduled_call_time?: string;
  webrtc_room_id: string;
}

type BookingEvent = { booking_id: string; [key: string]: unknown };

type CallScheduledEvent = {
  booking_id: string;
  scheduled_time?: string;
  webrtc_room_id: string;
};

export const CitizenVideoCall = ({ booking_id, lawyer_name, lawyer_id, onClose }: BookingWithCall) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  const [callState, setCallState] = useState<
    'idle' | 'requesting' | 'accepted' | 'scheduled' | 'active' | 'ended' | 'rejected'
  >('idle');
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Listen for call responses
  useEffect(() => {
    if (!socket) return;

    socket.on('call-accepted', (data: BookingEvent) => {
      if (data.booking_id === booking_id) {
        console.log('[Citizen] Call accepted by lawyer');
        setCallState('accepted');
        toast.success('Lawyer accepted your call request!');
      }
    });

    socket.on('call-rejected', (data: BookingEvent) => {
      if (data.booking_id === booking_id) {
        console.log('[Citizen] Call rejected by lawyer');
        setCallState('rejected');
        toast.error('Lawyer declined your call request');
      }
    });

    socket.on('call-scheduled', (data: CallScheduledEvent) => {
      if (data.booking_id === booking_id) {
        console.log('[Citizen] Call scheduled for:', data.scheduled_time);
        setCallState('scheduled');
        setCallStatus({
          booking_id,
          call_status: 'scheduled',
          scheduled_call_time: data.scheduled_time,
          webrtc_room_id: data.webrtc_room_id,
        });

        // Start countdown if needed
        if (data.scheduled_time) {
          const timeUntilCall = new Date(data.scheduled_time).getTime() - Date.now();
          if (timeUntilCall > 0) {
            setCountdownSeconds(Math.ceil(timeUntilCall / 1000));
          }
        }

        const scheduledLabel = data.scheduled_time
          ? new Date(data.scheduled_time).toLocaleTimeString()
          : 'soon';
        toast.success(`Call scheduled! Starting at ${scheduledLabel}`);
        setShowCallDialog(true);
      }
    });

    return () => {
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-scheduled');
    };
  }, [socket, booking_id]);

  // Countdown timer
  useEffect(() => {
    if (callState !== 'scheduled' || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Time to join the call
          handleJoinCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callState, countdownSeconds]);

  // Initiate video call
  const handleInitiateCall = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await api.post('/api/webrtc/initiate', { booking_id });

      setCallStatus(response.data.data);
      setCallState('requesting');
      setShowCallDialog(true);

      // Notify lawyer via socket
      socket?.emit('call-request', {
        booking_id,
        lawyer_id,
        citizen_id: user.id,
        citizen_name: user.full_name,
      });

      toast.info('Video call request sent to lawyer. Waiting for response...');
    } catch (error) {
      console.error('[Citizen] Error initiating call:', error);
      toast.error('Failed to initiate call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join the video call
  const handleJoinCall = async () => {
    if (!callStatus?.webrtc_room_id) {
      toast.error('Unable to join call: missing room information');
      return;
    }

    setCallState('active');
  };

  // End call
  const handleEndCall = async () => {
    try {
      await api.post('/api/webrtc/end', {
        booking_id,
      });

      setCallState('ended');
      setShowCallDialog(false);
      toast.success('Call ended');
    } catch (error) {
      console.error('[Citizen] Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If call is active, show video component
  if (callState === 'active' && callStatus) {
    return (
      <div className="w-full h-screen bg-black">
        <WebRTCVideo
          roomId={callStatus.webrtc_room_id}
          userId={user?.id || ''}
          isInitiator={false}
          onCallEnd={handleEndCall}
        />
      </div>
    );
  }

  return (
    <>
      {/* Call button for booking card */}
      {callState === 'idle' && (
        <Button
          onClick={handleInitiateCall}
          disabled={isLoading || !isConnected}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Phone className="w-4 h-4 mr-2" />
          {isLoading ? 'Initiating...' : 'Start Video Call'}
        </Button>
      )}

      {/* Call status indicator */}
      {(callState === 'requesting' || callState === 'accepted' || callState === 'scheduled') && (
        <Card className="p-4 border-2 border-blue-200 bg-blue-50 animate-pulse">
          <Badge className="mb-2" variant="outline">
            {callState === 'requesting' && 'Pending Response'}
            {callState === 'accepted' && 'Accepted'}
            {callState === 'scheduled' && 'Scheduled'}
          </Badge>
        </Card>
      )}

      {callState === 'rejected' && (
        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-4 h-4" />
            <p className="text-sm">Lawyer declined your call request</p>
          </div>
        </Card>
      )}

      {/* Call status dialog */}
      <Dialog 
        open={showCallDialog} 
        onOpenChange={(open) => {
          setShowCallDialog(open);
          if (!open && callState === 'idle') {
            onClose?.();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Video Call with {lawyer_name}</DialogTitle>
            <DialogDescription>
              {callState === 'requesting' && 'Waiting for lawyer to accept...'}
              {callState === 'accepted' && 'Lawyer accepted! Waiting for timing...'}
              {callState ===  'scheduled' && 'Call scheduled! Ready to join...'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status indicator */}
            {callState === 'requesting' && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            )}

            {callState === 'accepted' && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Lawyer is selecting the timing for your call...
                </AlertDescription>
              </Alert>
            )}

            {callState === 'scheduled' && (
              <div className="space-y-4">
                {callStatus?.scheduled_call_time && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Scheduled for:</p>
                    <p className="font-semibold text-green-700">
                      {new Date(callStatus.scheduled_call_time).toLocaleString()}
                    </p>
                  </div>
                )}

                {countdownSeconds > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Call starts in:</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCountdown(countdownSeconds)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {callState === 'scheduled' && countdownSeconds > 0 && (
              <Button
                onClick={handleJoinCall}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Join Call Now
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setShowCallDialog(false);
                if (callState === 'requesting') {
                  setCallState('idle');
                }
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
