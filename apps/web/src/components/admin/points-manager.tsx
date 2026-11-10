'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { ArrowRight, Pencil, Plus } from 'lucide-react';
import { BeachPointForm } from '@/components/admin/beach-point-form';
import { formatCoordinates, pointHours } from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

export function PointsManager({
  points,
  initialEditCode,
}: {
  points: BeachPointSummary[];
  initialEditCode?: string;
}) {
  const initialEditing = initialEditCode
    ? (points.find((point) => point.code === initialEditCode) ?? null)
    : null;
  const [editing, setEditing] = useState<BeachPointSummary | null>(initialEditing);
  const [adding, setAdding] = useState(!initialEditing);
  const formRef = useRef<HTMLDivElement>(null);

  const showForm = Boolean(editing) || adding;
  const inactiveCount = points.filter((point) => !point.isActive).length;

  const openForm = (mode: 'add' | 'edit', point?: BeachPointSummary) => {
    setEditing(mode === 'edit' ? (point ?? null) : null);
    setAdding(mode === 'add');
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const closeForm = () => {
    setEditing(null);
    setAdding(false);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-4">
          <PanelHeader
            eyebrow="Inventory"
            title="All beach points"
            right={
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                {points.length} total · {inactiveCount} inactive
              </span>
            }
          />
          <Button variant="secondary" onClick={() => openForm('add')}>
            <Plus aria-hidden className="h-4 w-4" />
            Add beach point
          </Button>
        </div>

        {points.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No beach points yet"
              body="Create the first point, then add its sunbeds so tourists can book."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-mist">
                  <th
                    scope="col"
                    className="px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Point
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Coordinates
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Hours
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Default price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Beds · free
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => {
                  const selected = editing?.id === point.id;
                  return (
                    <tr
                      key={point.id}
                      className={cn(
                        'border-b border-line/70 last:border-0',
                        selected ? 'bg-sea/5' : 'hover:bg-raised/30',
                        !point.isActive && !selected && 'bg-abyss/30',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md border border-line-strong bg-abyss/60 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-sea">
                            {point.code}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'truncate font-medium',
                                point.isActive ? 'text-foam' : 'text-mist',
                              )}
                            >
                              {point.name}
                            </p>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist">
                              sort {point.sortOrder}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {formatCoordinates(point.latitude, point.longitude)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {pointHours(point.openHour, point.closeHour)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums text-foam">
                        {formatMoney(point.defaultHourlyPriceMinor)}
                        <span className="ml-1 text-[10px] text-mist">/hr</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums">
                        <span className="text-foam">
                          {point.freeBeds}/{point.totalBeds}
                        </span>
                        <span className="ml-1.5 text-[10px] text-mist">
                          at {point.referenceSlotLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={point.isActive ? 'success' : 'warn'}>
                          {point.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-11"
                            aria-label={`Edit ${point.name}`}
                            onClick={() => openForm('edit', point)}
                          >
                            <Pencil aria-hidden className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Link
                            href={`/admin/points/${point.code}`}
                            aria-label={`Manage beds at ${point.name}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-mist transition-colors hover:bg-raised hover:text-sea"
                          >
                            <ArrowRight aria-hidden className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-4 py-2.5 text-[11px] text-mist">
          Free counts use each point&rsquo;s reference slot for today; inactive points still show
          their inventory but cannot be booked.
        </p>
      </Panel>

      <div ref={formRef} className="scroll-mt-28">
        {showForm ? (
          <Panel className="p-4">
            {editing ? (
              <BeachPointForm
                key={editing.id}
                point={editing}
                onSaved={closeForm}
                onCancel={closeForm}
              />
            ) : (
              <BeachPointForm key="new" onSaved={closeForm} />
            )}
          </Panel>
        ) : (
          <Panel className="p-4">
            <p className="label">Editor</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
              Select <span className="text-foam">Edit</span> on a point to change its name,
              coordinates, hours, default price or visibility.
            </p>
            <Button variant="secondary" className="mt-3" onClick={() => openForm('add')}>
              <Plus aria-hidden className="h-4 w-4" />
              Add beach point
            </Button>
          </Panel>
        )}
      </div>
    </div>
  );
}
