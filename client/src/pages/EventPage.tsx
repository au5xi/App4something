import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { api } from '../lib/api';

function fmt(d: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAttendees, setOpenAttendees] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.event(id!);
      setEvent(r.event);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const attendees = useMemo(() => {
    const p = event?.participants || [];
    return p.filter((x: any) => x.status === 'JOINED' || x.status === 'COHOST');
  }, [event]);

  const joined = useMemo(() => (event?.participants || []).filter((p: any) => p.status === 'JOINED').length, [event]);
  const interested = useMemo(() => (event?.participants || []).filter((p: any) => p.status === 'INTERESTED').length, [event]);

  const respond = async (status: 'INTERESTED' | 'JOINED' | 'DECLINED') => {
    await api.respondEvent(id!, status);
    await load();
  };

  const post = async () => {
    if (!message.trim()) return;
    await api.shout(id!, message.trim());
    setMessage('');
    await load();
  };

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!event) return <div className="text-slate-600">Not found.</div>;

  const displayAttendees = (event.participants || []).filter((p: any) => p.status === 'JOINED' || p.status === 'INTERESTED' || p.status === 'INVITED');

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">{event.activity}</h2>
          <div className="mt-1 text-slate-600">Host: <span className="font-semibold">{event.host?.name}</span></div>
          <div className="text-slate-600">Time: {fmt(event.startTime)}</div>
          {event.location && <div className="text-slate-600">Location: {event.location}</div>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {event.isPotential ? <Badge tone="amber">Potential</Badge> : <Badge tone="blue">Planned</Badge>}
          {event.isInstant && <Badge tone="slate">Instant</Badge>}
          <Badge tone="slate">{joined} going</Badge>
          {event.isPotential && <Badge tone="green">{interested} interested</Badge>}
        </div>
      </div>

      {event.notes && (
        <Card>
          <div className="font-extrabold">Additional notes</div>
          <div className="mt-1 text-slate-700 whitespace-pre-wrap">{event.notes}</div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div className="font-extrabold">Attendees</div>
          <Button variant="secondary" onClick={() => setOpenAttendees(true)}>View all</Button>
        </div>
        <div className="mt-3 flex -space-x-2">
          {displayAttendees.slice(0, 12).map((p: any) => (
            <div key={p.userId} className="ring-2 ring-white rounded-full">
              <Avatar url={p.user?.avatarUrl} name={p.user?.name || 'User'} size={36} />
            </div>
          ))}
          {displayAttendees.length === 0 && <div className="text-sm text-slate-600">No attendees yet.</div>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => respond('JOINED')}>I’m going</Button>
          <Button variant="secondary" onClick={() => respond('INTERESTED')}>Interested</Button>
          <Button variant="ghost" onClick={() => respond('DECLINED')}>Decline</Button>
        </div>
      </Card>

      <Card>
        <div className="font-extrabold">Shoutbox</div>
        <div className="mt-3 space-y-3">
          {(event.shouts || []).map((s: any) => (
            <div key={s.id} className="flex gap-3">
              <Avatar url={s.user?.avatarUrl} name={s.user?.name || 'User'} size={36} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div className="font-semibold">{s.user?.name}</div>
                  <div className="text-xs text-slate-500">{fmt(s.createdAt)}</div>
                </div>
                <div className="text-slate-700 whitespace-pre-wrap">{s.message}</div>
              </div>
            </div>
          ))}
          {(event.shouts || []).length === 0 && <div className="text-sm text-slate-600">No messages yet. Say hi 👋</div>}
        </div>

        <div className="mt-4 flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message…" />
          <Button onClick={post}>Post</Button>
        </div>
      </Card>

      <Modal open={openAttendees} title="All attendees" onClose={() => setOpenAttendees(false)}>
        <div className="space-y-2">
          {(event.participants || []).map((p: any) => (
            <div key={p.userId} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <Avatar url={p.user?.avatarUrl} name={p.user?.name || 'User'} size={36} />
                <div>
                  <div className="font-semibold">{p.user?.name}</div>
                  <div className="text-xs text-slate-500">{p.status}</div>
                </div>
              </div>
              <Badge tone={p.status === 'JOINED' ? 'green' : p.status === 'INTERESTED' ? 'amber' : 'slate'}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
