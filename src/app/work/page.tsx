import { V2ShellServer } from '@/app/v2-shell';
import { WorkContent } from './WorkContent';

export default function V2WorkPage() {
  return (
    <V2ShellServer>
      <div className="[--accent:#008000] [--accent-hover:#006b00]">
        <WorkContent />
      </div>
    </V2ShellServer>
  );
}
