import { LabHero, LabResearches } from '@/components/sections';
import { V2ShellServer } from '@/app/v2-shell';

export default function V2LabPage() {
  return (
    <V2ShellServer>
      <main className="min-h-screen bg-white [--accent:#008000] [--accent-hover:#006b00]">
        <LabHero />
        <LabResearches />
      </main>
    </V2ShellServer>
  );
}
