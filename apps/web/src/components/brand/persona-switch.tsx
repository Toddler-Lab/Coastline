'use client';

import type { SessionUser } from '@coastline/api-contracts';
import { setDemoUser } from '@/lib/api';

/** Dev-only role switcher. The API still resolves the role from the database. */
export function PersonaSwitch({ users, currentId }: { users: SessionUser[]; currentId: string }) {
  if (users.length === 0) {
    return null;
  }

  const current = users.find((user) => user.id === currentId) ?? users[0];

  return (
    <label className="group flex items-center gap-2 rounded-full border border-line bg-raised/50 pl-2.5 pr-1.5 py-1">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-sea shadow-[0_0_8px_rgba(111,231,210,0.8)]"
      />
      <span className="sr-only">Viewing as</span>
      <select
        value={current.id}
        onChange={(event) => {
          setDemoUser(event.target.value);
          window.location.reload();
        }}
        className="max-w-[9.5rem] cursor-pointer appearance-none bg-transparent pr-5 font-mono text-[10px] uppercase tracking-[0.1em] text-foam focus:outline-none"
        aria-label="Switch demo role"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id} className="bg-deep text-foam">
            {user.name} · {user.role === 'ADMIN' ? 'Admin' : 'Tourist'}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="-ml-4 h-3 w-3 text-mist"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
