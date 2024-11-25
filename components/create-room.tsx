"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export function CreateRoom() {
  const router = useRouter();

  const handleCreate = () => {
    const roomId = uuidv4();
    router.push(`/room/${roomId}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
          Create Voice Chat Room
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleCreate}>
          Create New Room
        </Button>
      </CardContent>
    </Card>
  );
}
