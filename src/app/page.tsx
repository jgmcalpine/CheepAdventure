import { Metadata } from 'next';
import LandingHeader from './components/LandingHeader';

export const metadata: Metadata = {
  title: 'CheepAdventure',
};

export default function Home() {
  return (
    <main>
      <LandingHeader />
    </main>
  );
}
