import { V2ShellServer } from '../shell';
import { WorkContent } from '@/app/(main)/work/WorkContent';

export default function V2WorkPage() {
  return (
    <V2ShellServer>
      <div className="[--accent:#008000] [--accent-hover:#006b00]">
        <WorkContent />
      </div>
    </V2ShellServer>
  );
}
