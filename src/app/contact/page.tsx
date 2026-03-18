import { getCachedContactInfo } from '@/lib/cache';
import { ContactContent } from './ContactContent';
import { V2ShellServer } from '@/app/v2-shell';

export default async function V2ContactPage() {
  const contactInfo = await getCachedContactInfo();

  return (
    <V2ShellServer>
      <div className="[--accent:#008000] [--accent-hover:#006b00]">
        <ContactContent contactInfo={contactInfo} />
      </div>
    </V2ShellServer>
  );
}
