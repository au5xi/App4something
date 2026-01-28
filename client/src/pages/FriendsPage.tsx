import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { api } from '../lib/api';

function statusLabel(f: any) {
  const s = f.status?.mode;
  if (!s || s === 'OFF') return { text: 'Not up', tone: 'slate' as const };
  if (s === 'SPECIFIC') return { text: `Up for ${f.status?.text}`, tone: 'green' as const };
  return { text: 'Up for something', tone: 'green' as const };
}

function locationLabel(f: any) {
  if (f.useCustomLocation) return f.customLocation || 'Custom';
  return f.homeLocation || 'Home';
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const load = async () => {
    const [f, r] = await Promise.all([api.friends(), api.friendRequests()]);
    setFriends(f.friends);
    setRequests(r.received);
  };

  useEffect(() => { load().catch((e) => alert(e.message)); }, []);

  // Autocomplete search after 3 chars (debounced)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchUsers(term).then((r) => setResults(r.users)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = async (id: string) => {
    try {
      await api.sendFriendRequest(id);
      alert('Request sent');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const accept = async (requestId: string) => {
    await api.acceptFriendRequest(requestId);
    await load();
  };

  const deny = async (requestId: string) => {
    await api.denyFriendRequest(requestId);
    await load();
  };

  const hasRequests = requests.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Friends</h2>
        <p className="text-slate-600">Compact overview + live search + requests.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-lg font-extrabold">Find people</div>
          <div className="mt-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email (min 3 chars)" />
          </div>

          {hasRequests && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-3">
              <div className="font-extrabold">Friend requests</div>
              <div className="mt-2 space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar url={r.from.avatarUrl} name={r.from.name} size={36} />
                      <div>
                        <div className="font-semibold">{r.from.name}</div>
                        <div className="text-xs text-slate-500">{r.from.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => accept(r.id)}>Accept</Button>
                      <Button variant="danger" onClick={() => deny(r.id)}>Deny</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="font-extrabold">Search results</div>
            <div className="mt-2 space-y-2">
              {results.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={u.avatarUrl} name={u.name} size={36} />
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <Button onClick={() => add(u.id)}>Add</Button>
                </div>
              ))}
              {q.trim().length >= 3 && results.length === 0 && (
                <div className="text-sm text-slate-600">No matches.</div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-extrabold">Friend statuses</div>
              <div className="text-sm text-slate-600">Three per row.</div>
            </div>
            <Button variant="secondary" onClick={load}>Refresh</Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {friends.map((f) => {
              const st = statusLabel(f);
              return (
                <div key={f.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={f.avatarUrl} name={f.name} size={42} />
                    <div>
                      <div className="font-extrabold text-sm">{f.name}</div>
                      <div className="text-xs text-slate-500">{locationLabel(f)}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge tone={st.tone}>{st.text}</Badge>
                  </div>
                </div>
              );
            })}
            {friends.length === 0 && <div className="text-sm text-slate-600">No friends yet. Use search to add someone.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
