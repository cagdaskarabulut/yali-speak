"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleJoin = () => {
    if (!roomId.trim()) {
      toast({
        title: "Room ID Required",
        description: "Please enter a valid Room ID",
        variant: "destructive",
      });
      return;
    }
    router.push(`/room/${roomId}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
          Join Voice Chat Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="roomId">Room ID</Label>
          <Input
            id="roomId"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleJoin}>
          Join Room
        </Button>
      </CardContent>
    </Card>
  );
}