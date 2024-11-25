import { CreateRoom } from '@/components/create-room';
import { JoinRoom } from '@/components/join-room';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
          Gaming Voice Chat
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          <CreateRoom />
          <JoinRoom />
        </div>
      </div>
    </main>
  );
}