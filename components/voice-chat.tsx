"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Users } from 'lucide-react';
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const SOCKET_SERVER = process.env.NEXT_PUBLIC_SOCKET_SERVER || 'http://localhost:3001';

export function VoiceChat() {
  const [roomId, setRoomId] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<any>();
  const streamRef = useRef<MediaStream>();
  const peersRef = useRef<{ [key: string]: SimplePeer.Instance }>({});
  
  const { toast } = useToast();

  useEffect(() => {
    // Generate room ID after component mounts to avoid hydration mismatch
    setRoomId(uuidv4());
  }, []);

  useEffect(() => {
    if (!roomId) return; // Only connect when roomId is available

    socketRef.current = io(SOCKET_SERVER);
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        joinRoom();
      })
      .catch((error) => {
        toast({
          title: "Mikrofon Erişimi Hatası",
          description: "Lütfen mikrofon izinlerini kontrol edin.",
          variant: "destructive"
        });
      });

    return () => {
      socketRef.current?.disconnect();
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  const joinRoom = () => {
    if (!streamRef.current || !roomId) return;

    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('user-joined', (userId: string) => {
      const peer = new SimplePeer({
        initiator: true,
        stream: streamRef.current,
        trickle: false
      });

      peer.on('signal', (signal) => {
        socketRef.current.emit('signal', { userId, signal });
      });

      peer.on('stream', handleStream);
      peersRef.current[userId] = peer;
      setConnectedPeers(prev => [...prev, userId]);
    });

    socketRef.current.on('user-left', (userId: string) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
        setConnectedPeers(prev => prev.filter(id => id !== userId));
      }
    });

    socketRef.current.on('receive-signal', ({ userId, signal }) => {
      if (!peersRef.current[userId]) {
        const peer = new SimplePeer({
          initiator: false,
          stream: streamRef.current,
          trickle: false
        });

        peer.on('signal', (signal) => {
          socketRef.current.emit('signal', { userId, signal });
        });

        peer.on('stream', handleStream);
        peer.signal(signal);
        peersRef.current[userId] = peer;
        setConnectedPeers(prev => [...prev, userId]);
      } else {
        peersRef.current[userId].signal(signal);
      }
    });

    setIsConnected(true);
  };

  const handleStream = (stream: MediaStream) => {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.volume = volume[0] / 100;
    audio.play();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    const audioElements = document.getElementsByTagName('audio');
    for (let audio of audioElements) {
      audio.volume = newVolume[0] / 100;
    }
  };

  return (
    <div className="container max-w-2xl mx-auto">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              Gaming Voice Chat
            </span>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{connectedPeers.length + 1}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="room">Oda ID</Label>
              <code className="px-2 py-1 rounded bg-muted">
                {roomId || 'Oluşturuluyor...'}
              </code>
            </div>
            
            <div className="flex items-center justify-between space-x-4">
              <Label>Mikrofon</Label>
              <Button
                variant={isMuted ? "destructive" : "default"}
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ses Seviyesi</Label>
                <span className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <Label>Gürültü Engelleme</Label>
              <Switch />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              {isConnected ? 
                `${connectedPeers.length + 1} kullanıcı bağlı` : 
                'Bağlanılıyor...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}