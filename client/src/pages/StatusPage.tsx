import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Select from '../components/Select';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

function dowLabel(d: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d);
}
function dayLabel(d: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
}

export default function StatusPage() {
  const { user, refresh } = useAuth();

  const [mode, setMode] = useState<'OFF' | 'GENERAL' | 'SPECIFIC'>(user?.status?.mode || 'OFF');
  const [text, setText] = useState<string>(user?.status?.text || '');

  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationMode, setLocationMode] = useState<'HOME' | 'CUSTOM'>(user?.useCustomLocation ? 'CUSTOM' : 'HOME');
  const [homeLocation, setHomeLocation] = useState(user?.homeLocation || 'Home');
  const [customLocation, setCustomLocation] = useState(user?.customLocation || '');

  const load = async () => {
    setLoading(true);
    const r = await api.getAvailability();
    setDays(r.days);
    setLoading(false);
  };

  useEffect(() => { load().catch((e) => alert(e.message)); }, []);
  useEffect(() => {
    setMode(user?.status?.mode || 'OFF');
    setText(user?.status?.text || '');
    setLocationMode(user?.useCustomLocation ? 'CUSTOM' : 'HOME');
    setHomeLocation(user?.homeLocation || 'Home');
    setCustomLocation(user?.customLocation || '');
  }, [user]);

  const toggleDay = (idx: number) => {
    setDays((arr) => arr.map((d, i) => (i === idx ? { ...d, isUp: !d.isUp } : d)));
  };

  const weeks = useMemo(() => {
    const out: any[][] = [];
    for (let w = 0; w < 4; w++) out.push(days.slice(w * 7, w * 7 + 7));
    return out;
  }, [days]);

  const save = async () => {
    try {
      await api.statusSummary({ mode, text: mode === 'SPECIFIC' ? text : null });
      // save location
      await api.updateProfile({
        homeLocation,
        customLocation,
        useCustomLocation: locationMode === 'CUSTOM',
      });
      // save availability
      await api.setAvailability(days.map((d) => ({ date: d.date, isUp: d.isUp, upText: d.upText ?? null })));
      await refresh();
      alert('Saved');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Status</h2>
        <p className="text-slate-600">Set your overall status + your availability for the next 4 weeks.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-lg font-extrabold">Summary status</div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={mode === 'OFF'} onChange={() => setMode('OFF')} />
              <span className="font-semibold">Not up right now</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={mode === 'GENERAL'} onChange={() => setMode('GENERAL')} />
              <span className="font-semibold">Up for something</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={mode === 'SPECIFIC'} onChange={() => setMode('SPECIFIC')} />
              <span className="font-semibold">Up for…</span>
            </label>
            {mode === 'SPECIFIC' && (
              <div>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., sauna, board games" />
                <div className="mt-1 text-xs text-slate-500">Max 64 chars.</div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-semibold">Current:</div>
              <div className="mt-1">
                {mode === 'OFF' ? <Badge>Not up</Badge> : mode === 'SPECIFIC' ? <Badge tone="green">Up for {text || '…'}</Badge> : <Badge tone="green">Up for something</Badge>}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-lg font-extrabold">Location</div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-semibold">Mode</label>
              <Select value={locationMode} onChange={(e) => setLocationMode(e.target.value as any)}>
                <option value="HOME">Home</option>
                <option value="CUSTOM">Custom location</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold">Home location label</label>
              <Input value={homeLocation} onChange={(e) => setHomeLocation(e.target.value)} placeholder="Home" />
            </div>
            {locationMode === 'CUSTOM' && (
              <div>
                <label className="text-sm font-semibold">Custom location</label>
                <Input value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} placeholder="e.g., Tampere" />
              </div>
            )}
            <div className="text-xs text-slate-500">Friends cards will show your current location label.</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold">4-week availability</div>
            <div className="text-sm text-slate-600">Click days to toggle availability (green = up).</div>
          </div>
          <Button onClick={save}>Save</Button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-slate-600">Loading…</div>
        ) : (
          <div className="mt-4 space-y-3">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-2">
                {week.map((d, di) => {
                  const date = new Date(d.date);
                  const idx = wi * 7 + di;
                  return (
                    <button
                      key={d.date}
                      onClick={() => toggleDay(idx)}
                      className={`rounded-2xl border p-2 text-left transition ${d.isUp ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div className="text-xs text-slate-500">{dowLabel(date)}</div>
                      <div className="text-sm font-extrabold">{dayLabel(date)}</div>
                      <div className="mt-1 text-xs">
                        {d.isUp ? <span className="text-green-700 font-semibold">Up</span> : <span className="text-slate-500">—</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
