import { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';
import { toast } from 'sonner';
import { WebRTCVideo } from './WebRTCVideo';

interface IncomingCall {
  booking_id: string;
  citizen_id: string;
  citizen_name: string;
}

export const LawyerAlertsTab = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<IncomingCall | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [startNow, setStartNow] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [activeCallBookingId, setActiveCallBookingId] = useState<string | null>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', (data: IncomingCall) => {
      console.log('[Lawyer] Incoming call from:', data.citizen_name);
      setIncomingCalls((prev) => [...prev, data]);
      toast.info(`${data.citizen_name} is requesting a video call!`);
    });

    socket.on('call-accepted', () => {
      console.log('[Lawyer] Call accepted confirmation');
      toast.success('Call has been accepted');
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
    };
  }, [socket]);

  // Accept call
  const handleAcceptCall = async (call: IncomingCall) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await api.post('/api/webrtc/accept', {
        booking_id: call.booking_id,
      });

      // Notify citizen via socket
      socket?.emit('accept-call', {
        booking_id: call.booking_id,
        citizen_id: call.citizen_id,
      });

      // Remove from incoming calls
      setIncomingCalls((prev) => prev.filter((c) => c.booking_id !== call.booking_id));
      setSelectedCall(call);
      setIsScheduling(true);
      toast.success('Call accepted! Now schedule the timing.');
    } catch (error) {
      console.error('[Lawyer] Error accepting call:', error);
      toast.error('Failed to accept call');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject call
  const handleRejectCall = async (call: IncomingCall) => {
    setIsLoading(true);
    try {
      await api.post('/api/webrtc/reject', {
        booking_id: call.booking_id,
      });

      // Notify citizen via socket
      socket?.emit('reject-call', {
        booking_id: call.booking_id,
        citizen_id: call.citizen_id,
      });

      setIncomingCalls((prev) => prev.filter((c) => c.booking_id !== call.booking_id));
      toast.success('Call rejected');
    } catch (error) {
      console.error('[Lawyer] Error rejecting call:', error);
      toast.error('Failed to reject call');
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule or start call
  const handleScheduleCall = async () => {
    if (!selectedCall) return;

    if (!startNow && !scheduledTime) {
      toast.error('Please select a time or start now');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(
        '/api/webrtc/schedule',
        {
          booking_id: selectedCall.booking_id,
          start_immediately: startNow,
          scheduled_time: !startNow ? new Date(scheduledTime).toISOString() : null,
        },
      );

      const roomId = response.data.data.webrtc_room_id;

      // Notify citizen via socket
      socket?.emit('schedule-call', {
        booking_id: selectedCall.booking_id,
        citizen_id: selectedCall.citizen_id,
        scheduled_time: scheduledTime,
        webrtc_room_id: roomId,
      });

      if (startNow) {
        toast.success('Starting call now!');
        setActiveCallRoomId(roomId);
        setActiveCallBookingId(selectedCall.booking_id);
      } else {
        toast.success('Call scheduled!');
      }
      setIsScheduling(false);
      setSelectedCall(null);
      setStartNow(false);
      setScheduledTime('');
    } catch (error) {
      console.error('[Lawyer] Error scheduling call:', error);
      toast.error('Failed to schedule call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (activeCallBookingId) {
      try {
        await api.post('/api/webrtc/end', { booking_id: activeCallBookingId });
        toast.success('Call ended');
      } catch (error) {
        console.error('[Lawyer] Error ending call:', error);
      }
    }
    setActiveCallRoomId(null);
    setActiveCallBookingId(null);
  };

  if (!isConnected) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Connecting to alerts system...
        </AlertDescription>
      </Alert>
    );
  }

  if (activeCallRoomId) {
    return (
      <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
        <WebRTCVideo
          roomId={activeCallRoomId}
          userId={user?.id || ''}
          isInitiator={true}
          onCallEnd={handleEndCall}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomingCalls.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No incoming calls at the moment</p>
        </Card>
      ) : (
        incomingCalls.map((call) => (
          <Card
            key={call.booking_id}
            className="p-4 border-2 border-blue-200 bg-blue-50 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-blue-900">
                  {call.citizen_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Booking: {call.booking_id.slice(0, 8)}...
                </p>
              </div>
              <Badge variant="destructive">Incoming</Badge>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleAcceptCall(call)}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => handleRejectCall(call)}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Schedule call dialog */}
      <Dialog open={isScheduling} onOpenChange={setIsScheduling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Video Call</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Calling: <span className="font-semibold">{selectedCall?.citizen_name}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={startNow}
                  onChange={(e) => {
                    setStartNow(e.target.checked);
                    if (e.target.checked) {
                      setScheduledTime('');
                    }
                  }}
                  className="mr-2"
                />
                Start Video Call Immediately
              </Label>
            </div>

            {!startNow && (
              <div className="space-y-2">
                <Label htmlFor="call-time">Schedule for Later:</Label>
                <Input
                  id="call-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500">
                  {scheduledTime
                    ? `Scheduled for: ${new Date(scheduledTime).toLocaleString()}`
                    : 'Select a date and time for the call'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduling(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleCall}
              disabled={isLoading || (!startNow && !scheduledTime)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Clock className="w-4 h-4 mr-2 animate-spin" />}
              {startNow ? 'Start Now' : 'Schedule Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
