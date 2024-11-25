import { VoiceChat } from "@/components/voice-chat";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="container max-w-2xl mx-auto">
        <VoiceChat roomId={params.roomId} />
      </div>
    </main>
  );
}
