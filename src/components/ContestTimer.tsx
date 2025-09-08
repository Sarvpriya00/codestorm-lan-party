import { useState, useEffect, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Clock,
  Calendar,
  Users,
  Wifi,
  WifiOff
} from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import websocketService from "@/lib/websocket";

interface Contest {
  id: string;
  name: string;
  description?: string;
  startTime: string | null;
  endTime: string | null;
  status: 'PLANNED' | 'RUNNING' | 'ENDED' | 'ARCHIVED';
}

interface SystemControl {
  id: string;
  contestId: string;
  controlCode: number;
  value: any;
  setById: string;
  setAt: string;
}

interface ContestTimerProps {
  contestId?: string;
  className?: string;
}

export function ContestTimer({ contestId, className = "" }: ContestTimerProps) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const { user } = useContext(AuthContext);

  // Fetch contest data
  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        setError(null);

        let contestData: Contest;
        
        if (contestId) {
          const response = await api.get(`/contests/${contestId}`);
          contestData = response.data;
        } else {
          // Get current active contest
          const response = await api.get('/contests?status=RUNNING');
          const contests = response.data;
          
          if (contests.length === 0) {
            // Try to get planned contests
            const plannedResponse = await api.get('/contests?status=PLANNED');
            const plannedContests = plannedResponse.data;
            
            if (plannedContests.length === 0) {
              setError('No active or planned contests found');
              return;
            }
            
            contestData = plannedContests[0];
          } else {
            contestData = contests[0];
          }
        }

        setContest(contestData);

        // Get participant count
        const participantsResponse = await api.get(`/contests/${contestData.id}/participants`);
        setParticipantCount(participantsResponse.data.length);

      } catch (err) {
        console.error('Error fetching contest:', err);
        setError('Failed to load contest data');
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user || !contest) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(user.id);
        websocketService.joinContest(contest.id);
        setIsConnected(true);

        // Handle contest phase changes
        websocketService.onContestPhaseChange((updatedContest: Contest) => {
          console.log('Contest phase changed:', updatedContest);
          setContest(updatedContest);
        });

        // Handle system control updates
        websocketService.onSystemControlUpdate((control: SystemControl) => {
          console.log('System control update:', control);
          // Handle timer controls, phase changes, etc.
        });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.leaveContest();
      setIsConnected(false);
    };
  }, [user, contest]);

  // Timer calculation
  useEffect(() => {
    if (!contest) return;

    const updateTimer = () => {
      const now = new Date();
      
      if (contest.startTime) {
        const startTime = new Date(contest.startTime);
        
        if (contest.endTime) {
          const endTime = new Date(contest.endTime);
          
          if (now < startTime) {
            // Contest hasn't started yet
            const diffMs = startTime.getTime() - now.getTime();
            setTimeRemaining(formatDuration(diffMs));
            setTimeElapsed('Not started');
          } else if (now >= startTime && now < endTime) {
            // Contest is running
            const remainingMs = endTime.getTime() - now.getTime();
            const elapsedMs = now.getTime() - startTime.getTime();
            
            setTimeRemaining(formatDuration(remainingMs));
            setTimeElapsed(formatDuration(elapsedMs));
          } else {
            // Contest has ended
            const elapsedMs = endTime.getTime() - startTime.getTime();
            setTimeRemaining('Contest ended');
            setTimeElapsed(formatDuration(elapsedMs));
          }
        } else {
          // No end time specified
          if (now >= startTime) {
            const elapsedMs = now.getTime() - startTime.getTime();
            setTimeRemaining('No time limit');
            setTimeElapsed(formatDuration(elapsedMs));
          } else {
            const diffMs = startTime.getTime() - now.getTime();
            setTimeRemaining(formatDuration(diffMs));
            setTimeElapsed('Not started');
          }
        }
      } else {
        setTimeRemaining('No schedule');
        setTimeElapsed('Unknown');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  const formatDuration = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (contest?.status) {
      case 'RUNNING':
        return <Play className="h-5 w-5 text-green-500" />;
      case 'PLANNED':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'ENDED':
        return <Square className="h-5 w-5 text-red-500" />;
      case 'ARCHIVED':
        return <Pause className="h-5 w-5 text-gray-500" />;
      default:
        return <Timer className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (contest?.status) {
      case 'RUNNING':
        return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'PLANNED':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'ENDED':
        return 'bg-red-500/20 text-red-700 border-red-500/50';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !contest) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error || 'No contest data'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${contest.status === 'RUNNING' ? 'border-green-500/50 bg-green-500/5' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold">{contest.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {contest.description || 'Contest in progress'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>
                {contest.status}
              </Badge>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          {/* Timer Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <p className={`text-2xl font-mono font-bold ${
                contest.status === 'RUNNING' && timeRemaining !== 'Contest ended' 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}>
                {timeRemaining}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Elapsed</span>
              </div>
              <p className="text-2xl font-mono font-bold text-muted-foreground">
                {timeElapsed}
              </p>
            </div>
          </div>

          {/* Contest Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {contest.startTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {new Date(contest.startTime).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participantCount} participants</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}