import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import Badge from '../components/Badge';
import FriendPickerModal from '../components/FriendPickerModal';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const PRESETS = ['Board games', 'Sauna', 'Drinks', 'Movie night', 'Walk', 'Gym', 'Coffee'];

function isoLocal(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function fmt(d: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

export default function HostPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [activityPreset, setActivityPreset] = useState(PRESETS[0]);
  const [customActivity, setCustomActivity] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [isInstant, setIsInstant] = useState(true);
  const [startTime, setStartTime] = useState(isoLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [isPotential, setIsPotential] = useState(false);

  const [invitees, setInvitees] = useState<string[]>([]);
  const [cohosts, setCohosts] = useState<string[]>([]);

  const [openInvite, setOpenInvite] = useState(false);
  const [openCohost, setOpenCohost] = useState(false);

  const load = async () => {
    const [f, e] = await Promise.all([api.friends(), api.events()]);
    setFriends(f.friends);

    // Only show created or co-hosted events in "Your events"
    const mine = (e.events || []).filter((ev: any) => {
      if (ev.hostId === user?.id) return true;
      const co = (ev.cohosts || []).some((c: any) => c.userId === user?.id);
      return co;
    });
    setEvents(mine);
  };

  useEffect(() => { load().catch((e) => alert(e.message)); }, []);

  const activity = customActivity.trim() ? customActivity.trim() : activityPreset;
  const inviteLabel = useMemo(() => invitees.length ? `${invitees.length} invited` : 'Invite friends', [invitees.length]);
  const cohostLabel = useMemo(() => cohosts.length ? `${cohosts.length} co-hosts` : 'Add co-hosts', [cohosts.length]);

  const create = async () => {
    try {
      await api.createEvent({
        activity,
        isInstant,
        startTime: isInstant ? undefined : new Date(startTime).toISOString(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isPotential,
        inviteeIds: invitees,
        cohostIds: cohosts,
      });
      setCustomActivity('');
      setLocation('');
      setNotes('');
      setImageUrl('');
      setInvitees([]);
      setCohosts([]);
      setIsPotential(false);
      await load();
      alert('Event created!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Host</h2>
          <p className="text-slate-600">Create an event and invite friends. Instant events are scheduled for today.</p>
        </div>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold">Create event</div>
              <div className="text-sm text-slate-600">Add location + notes + optional "potential" flag.</div>
            </div>
            {isPotential ? <Badge tone="amber">Potential</Badge> : <Badge tone="blue">Planned</Badge>}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-semibold">Preset activity</label>
              <Select value={activityPreset} onChange={(e) => setActivityPreset(e.target.value)}>
                {PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Or custom activity</label>
              <Input value={customActivity} onChange={(e) => setCustomActivity(e.target.value)} placeholder="e.g., pizza + cards" />
            </div>

            <div>
              <label className="text-sm font-semibold">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., My place / City sauna" />
            </div>

            <div>
              <label className="text-sm font-semibold">Additional notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything people should know?" />
            </div>

            <div>
              <label className="text-sm font-semibold">Event image URL (optional)</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              <div className="mt-1 text-xs text-slate-500">No images are generated by the app. Use your own placeholder URLs.</div>
            </div>

            <div className="flex items-center gap-3">
              <input id="instant" type="checkbox" checked={isInstant} onChange={(e) => setIsInstant(e.target.checked)} />
              <label htmlFor="instant" className="text-sm font-semibold">Host instantly (today)</label>
            </div>

            {!isInstant && (
              <div>
                <label className="text-sm font-semibold">Start time</label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input id="potential" type="checkbox" checked={isPotential} onChange={(e) => setIsPotential(e.target.checked)} />
              <label htmlFor="potential" className="text-sm font-semibold">Make event potential (needs interest)</label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setOpenInvite(true)}>{inviteLabel}</Button>
              <Button variant="secondary" onClick={() => setOpenCohost(true)}>{cohostLabel}</Button>
            </div>

            <Button className="w-full" onClick={create}>Create event</Button>
          </div>
        </Card>

        <Card>
          <div className="text-lg font-extrabold">Your events</div>
          <div className="mt-1 text-sm text-slate-600">Only events you created or co-host are shown.</div>

          <div className="mt-4 space-y-3">
            {events.length === 0 ? (
              <div className="text-sm text-slate-600">No events yet.</div>
            ) : (
              events.slice(0, 12).map((ev) => (
                <div key={ev.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">{fmt(ev.startTime)}</div>
                      <div className="font-extrabold">{ev.activity}</div>
                      <div className="text-sm text-slate-600">Host: {ev.host?.name}</div>
                      {ev.location && <div className="text-sm text-slate-600">📍 {ev.location}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {ev.isPotential ? <Badge tone="amber">Potential</Badge> : <Badge tone="blue">Planned</Badge>}
                      {ev.isInstant && <Badge tone="slate">Instant</Badge>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <FriendPickerModal
        open={openInvite}
        title="Invite friends"
        friends={friends}
        initialSelected={invitees}
        onClose={() => setOpenInvite(false)}
        onConfirm={(ids) => {
          setInvitees(ids);
          // prevent overlap: a co-host is automatically joined; allow co-host also in invited list? We'll remove duplicates.
          setInvitees(ids.filter((x) => !cohosts.includes(x)));
          setOpenInvite(false);
        }}
      />

      <FriendPickerModal
        open={openCohost}
        title="Select co-hosts"
        friends={friends}
        initialSelected={cohosts}
        onClose={() => setOpenCohost(false)}
        onConfirm={(ids) => {
          setCohosts(ids);
          // remove from invitees to avoid duplicate roles
          setInvitees((inv) => inv.filter((x) => !ids.includes(x)));
          setOpenCohost(false);
        }}
      />
    </div>
  );
}
