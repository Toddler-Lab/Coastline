import { Flag, PackageSearch, Phone, Siren } from 'lucide-react';
import type { EmergencyContactDto } from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { RowLink } from './spot-hub-sections';

/** Used when a destination has no numbers entered yet. */
export const NATIONAL_EMERGENCY: EmergencyContactDto = {
  label: 'National emergency service',
  labelBn: 'জাতীয় জরুরি সেবা',
  phone: '999',
  kind: 'NATIONAL',
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

/** Public numbers entered by the operator, each with a call button. */
export function EmergencyContacts({ contacts }: { contacts?: EmergencyContactDto[] }) {
  const list = contacts && contacts.length > 0 ? contacts : [NATIONAL_EMERGENCY];
  return (
    <ul className="space-y-2">
      {list.map((contact) => {
        const primary = contact.kind === 'NATIONAL';
        return (
          <li key={`${contact.kind}-${contact.phone}`}>
            <a
              href={telHref(contact.phone)}
              className={cn(
                'flex min-h-20 items-center gap-4 rounded-md border px-4 py-3',
                primary ? 'border-danger/40 bg-danger/6 hover:bg-danger/10' : 'border-line bg-surface hover:bg-surface-alt',
              )}
            >
              <span
                className={cn(
                  'grid size-12 flex-none place-items-center rounded-full',
                  primary ? 'bg-danger text-surface' : 'bg-primary-soft text-primary',
                )}
              >
                <Phone aria-hidden className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-title-sm">Call {contact.phone}</span>
                <span className="block text-body-sm text-muted">
                  {contact.label}
                  {contact.labelBn ? (
                    <>
                      {' · '}
                      <span lang="bn">{contact.labelBn}</span>
                    </>
                  ) : null}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** "Need help?" block for destination and spot hubs. */
export function HelpShortcuts() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <RowLink href="/help/emergency" icon={Siren} title="Emergency" body="Numbers and what to do" tone="danger" />
      <RowLink href="/help/lost-found" icon={PackageSearch} title="Lost and found" body="Report or find an item" />
      <RowLink href="/help/report" icon={Flag} title="Report a problem" body="Overcharging, safety, a listing" />
    </div>
  );
}

export function NoDispatchNote() {
  return (
    <p className="text-body-sm text-muted">
      These are public numbers. Coastline is a booking platform: it does not dispatch police, ambulance or rescue.
    </p>
  );
}
