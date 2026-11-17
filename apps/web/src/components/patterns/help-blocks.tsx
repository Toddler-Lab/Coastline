import { Flag, PackageSearch, Phone, Siren } from 'lucide-react';
import { RowLink } from './hub';

/**
 * Bangladesh's national emergency number. Destination-specific numbers
 * (tourist police, hospital, coast guard) are entered by the operator in
 * WP-20; until then only the national number is shown.
 */
export const NATIONAL_EMERGENCY = { label: 'National emergency service', number: '999' };

export function EmergencyCallCard() {
  return (
    <a
      href={`tel:${NATIONAL_EMERGENCY.number}`}
      className="flex min-h-20 items-center gap-4 rounded-md border border-danger/40 bg-danger/6 px-4 py-3 hover:bg-danger/10"
    >
      <span className="grid size-12 flex-none place-items-center rounded-full bg-danger text-surface">
        <Phone aria-hidden className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-sm">Call {NATIONAL_EMERGENCY.number}</span>
        <span className="block text-body-sm text-muted">
          {NATIONAL_EMERGENCY.label}: police, fire, ambulance
        </span>
      </span>
    </a>
  );
}

/** "Need help?" block for destination and spot hubs. */
export function HelpShortcuts() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <RowLink
        href="/help/emergency"
        icon={Siren}
        title="Emergency"
        body="Numbers and what to do"
        tone="danger"
      />
      <RowLink
        href="/help/lost-found"
        icon={PackageSearch}
        title="Lost and found"
        body="Report or find an item"
      />
      <RowLink
        href="/help/report"
        icon={Flag}
        title="Report a problem"
        body="Overcharging, safety, a listing"
      />
    </div>
  );
}

export function NoDispatchNote() {
  return (
    <p className="text-body-sm text-muted">
      These are public numbers. Coastline is a booking platform: it does not dispatch police,
      ambulance or rescue.
    </p>
  );
}
