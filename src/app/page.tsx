import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CheepAdventure',
};

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">CheepAdventure coming soon</h1>
    </div>
  );
}
