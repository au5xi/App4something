import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';

function statusLabel(f: any) {
  const s = f.status?.mode;
  if (!s || s === 'OFF') return 'Not up';
  if (s === 'SPECIFIC') return `Up for ${f.status?.text}`;
  return 'Up for something';
}

function locationLabel(f: any) {
  if (f.useCustomLocation) return f.customLocation || 'Custom';
  return f.homeLocation || 'Home';
}

export default function FriendPickerModal({
  open,
  title,
  friends,
  initialSelected,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  friends: any[];
  initialSelected: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const id of initialSelected) map[id] = true;
    return map;
  });

  // reset when opened
  React.useEffect(() => {
    if (open) {
      const map: Record<string, boolean> = {};
      for (const id of initialSelected) map[id] = true;
      setSelected(map);
    }
  }, [open, initialSelected]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-600">Click a friend to toggle selection.</div>
        <div className="text-xs text-slate-500">Selected: {selectedIds.length}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {friends.map((f) => {
          const isOn = !!selected[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setSelected((s) => ({ ...s, [f.id]: !s[f.id] }))}
              className={`relative text-left rounded-2xl border p-3 transition ${isOn ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <Avatar url={f.avatarUrl} name={f.name} size={40} />
                <div>
                  <div className="font-extrabold">{f.name}</div>
                  <div className="text-xs text-slate-600">{statusLabel(f)} • {locationLabel(f)}</div>
                </div>
              </div>
              {isOn && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-black">✓</div>
              )}
            </button>
          );
        })}
        {friends.length === 0 && <div className="text-sm text-slate-600">No friends yet.</div>}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100" onClick={onClose}>Cancel</button>
        <button
          className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
          onClick={() => onConfirm(selectedIds)}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
