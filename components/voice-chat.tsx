"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Copy, Mic, MicOff, Users } from "lucide-react";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

const SOCKET_SERVER =
  process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:3001";

interface VoiceChatProps {
  roomId: string;
}

export function VoiceChat({ roomId }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<any>();
  const streamRef = useRef<MediaStream>();
  const peersRef = useRef<{ [key: string]: SimplePeer.Instance }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) return;

    socketRef.current = io(SOCKET_SERVER);

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        streamRef.current = stream;
        joinRoom();
      })
      .catch((error) => {
        toast({
          title: "Microphone Access Error",
          description: "Please check your microphone permissions.",
          variant: "destructive",
        });
      });

    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      Object.values(audioRefs.current).forEach((audio) => audio.remove());
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const createPeer = (
    userId: string,
    stream: MediaStream,
    initiator: boolean
  ) => {
    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { userId, signal });
    });

    peer.on("stream", (remoteStream) => {
      if (!audioRefs.current[userId]) {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.volume = volume[0] / 100;
        audio.autoplay = true;
        audioRefs.current[userId] = audio;
      }
    });

    return peer;
  };

  const joinRoom = () => {
    if (!streamRef.current || !roomId) return;

    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("users-in-room", (users: string[]) => {
      setConnectedPeers(users.filter((id) => id !== socketRef.current.id));
    });

    socketRef.current.on("user-joined", (userId: string) => {
      const peer = createPeer(userId, streamRef.current!, true);
      peersRef.current[userId] = peer;

      toast({
        title: "New User",
        description: "A user has joined the room.",
      });
    });

    socketRef.current.on("user-left", (userId: string) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      if (audioRefs.current[userId]) {
        audioRefs.current[userId].remove();
        delete audioRefs.current[userId];
      }
      setConnectedPeers((prev) => prev.filter((id) => id !== userId));

      toast({
        title: "User Left",
        description: "A user has left the room.",
      });
    });

    socketRef.current.on(
      "receive-signal",
      ({ userId, signal }: { userId: string; signal: any }) => {
        if (!peersRef.current[userId]) {
          const peer = createPeer(userId, streamRef.current!, false);
          peersRef.current[userId] = peer;
        }
        peersRef.current[userId].signal(signal);
      }
    );

    setIsConnected(true);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    Object.values(audioRefs.current).forEach((audio) => {
      audio.volume = newVolume[0] / 100;
    });
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast({
        title: "Copied!",
        description: "Room ID has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy Room ID.",
        variant: "destructive",
      });
    }
  };

  const handleBackToHome = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    Object.values(audioRefs.current).forEach((audio) => audio.remove());
    socketRef.current?.disconnect();
    router.push("/");
  };

  return (
    <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToHome}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            Gaming Voice Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{connectedPeers.length + 1}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="room">Room ID</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyRoomId}
                className="h-8 w-8"
                title="Copy ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <code className="block w-full text-center p-2 rounded bg-muted font-mono text-sm">
              {roomId}
            </code>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Share this ID with friends to invite them to the room
            </p>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <Label>Microphone</Label>
            <Button
              variant={isMuted ? "destructive" : "default"}
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
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
            <Label>Noise Suppression</Label>
            <Switch defaultChecked />
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center">
            {isConnected
              ? `${connectedPeers.length + 1} users connected`
              : "Connecting..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
