import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { api } from '../lib/api';

function fmt(d: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

function bgStyle(imageUrl?: string | null) {
  const url = imageUrl || '';
  // Do not generate images; just use whatever URL user provides.
  return {
    backgroundImage: url ? `linear-gradient(90deg, rgba(15,23,42,0.85), rgba(15,23,42,0.15)), url(${url})` : `linear-gradient(90deg, rgba(15,23,42,0.85), rgba(15,23,42,0.15))`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as React.CSSProperties;
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.events();
      setEvents(r.events);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch((e) => alert(e.message)); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Events</h2>
          <p className="text-slate-600">Only events you’re invited to (or host/co-host) appear here.</p>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="text-slate-600">Loading…</div>
      ) : events.length === 0 ? (
        <Card>
          <div className="text-slate-700 font-semibold">No events yet.</div>
          <div className="text-sm text-slate-600">Go to Host to create one and invite friends.</div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((ev) => {
            const joined = (ev.participants || []).filter((p: any) => p.status === 'JOINED').length;
            const interested = (ev.participants || []).filter((p: any) => p.status === 'INTERESTED').length;
            return (
              <button key={ev.id} onClick={() => nav(`/events/${ev.id}`)} className="text-left">
                <Card className="p-0 overflow-hidden">
                  <div className="h-28" style={bgStyle(ev.imageUrl)} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-500">{fmt(ev.startTime)}</div>
                        <div className="text-lg font-extrabold">{ev.activity}</div>
                        <div className="text-sm text-slate-600">Host: <span className="font-semibold">{ev.host?.name}</span></div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {ev.isPotential ? <Badge tone="amber">Potential</Badge> : <Badge tone="blue">Planned</Badge>}
                        {ev.isInstant && <Badge tone="slate">Instant</Badge>}
                        <Badge tone="slate">{joined} going</Badge>
                        {ev.isPotential && <Badge tone="green">{interested} interested</Badge>}
                      </div>
                    </div>
                    {ev.location && <div className="mt-2 text-sm text-slate-600">📍 {ev.location}</div>}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
