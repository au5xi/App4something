import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { api } from '../lib/api';

function dayLabel(d: string) {
  const date = new Date(d);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function CalendarPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [timeline, setTimeline] = useState<any[]>([]);
  const [start, setStart] = useState<string>('');

  const loadFriends = async () => {
    const r = await api.friends();
    setFriends(r.friends);
  };

  useEffect(() => { loadFriends().catch((e) => alert(e.message)); }, []);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const loadTimeline = async () => {
    if (selectedIds.length === 0) {
      setTimeline([]);
      return;
    }
    const r = await api.calendarFriends(selectedIds);
    setStart(r.start);
    setTimeline(r.friends);
  };

  useEffect(() => {
    loadTimeline().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  const headerDays = useMemo(() => {
    if (!timeline.length) return [];
    return timeline[0].days.map((d: any) => d.date);
  }, [timeline]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Calendar</h2>
          <p className="text-slate-600">Filter by friends and see who’s up for something over the next 4 weeks.</p>
        </div>
        <Button variant="secondary" onClick={loadTimeline}>Refresh</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-lg font-extrabold">Friends</div>
          <div className="mt-3 space-y-2">
            {friends.map((f) => (
              <label key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                <input type="checkbox" checked={!!selected[f.id]} onChange={(e) => setSelected((s) => ({ ...s, [f.id]: e.target.checked }))} />
                <Avatar url={f.avatarUrl} name={f.name} size={32} />
                <span className="font-semibold text-sm">{f.name}</span>
              </label>
            ))}
            {friends.length === 0 && <div className="text-sm text-slate-600">Add friends to use the calendar.</div>}
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold">Timeline</div>
              {start && <div className="text-sm text-slate-600">Starting {dayLabel(start)}</div>}
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">Select one or more friends to see availability.</div>
          ) : (
            <div className="mt-4 min-w-[860px]">
              <div className="grid" style={{ gridTemplateColumns: `200px repeat(${headerDays.length}, 1fr)` }}>
                <div className="sticky left-0 bg-white z-10 font-semibold text-sm p-2 border-b border-slate-200">Friend</div>
                {headerDays.map((d) => (
                  <div key={d} className="p-2 text-xs text-slate-500 border-b border-slate-200">{dayLabel(d)}</div>
                ))}

                {timeline.map((f: any) => (
                  <React.Fragment key={f.id}>
                    <div className="sticky left-0 bg-white z-10 p-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Avatar url={f.avatarUrl} name={f.name} size={28} />
                        <div className="font-semibold text-sm">{f.name}</div>
                      </div>
                    </div>
                    {f.days.map((d: any) => (
                      <div key={d.date} className={`border-b border-slate-200 p-2 ${d.isUp ? 'bg-green-50' : ''}`}>
                        <div className={`h-5 w-full rounded-lg ${d.isUp ? 'bg-green-500/70' : 'bg-slate-100'}`} />
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
