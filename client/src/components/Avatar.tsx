import React from 'react';

export default function Avatar({ url, name, size = 36 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const s = { width: size, height: size } as React.CSSProperties;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={s}
        className="rounded-full object-cover border border-slate-200 bg-slate-100"
        onError={(e) => {
          (e.currentTarget as any).src = '';
        }}
      />
    );
  }

  return (
    <div style={s} className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-700">
      {initials || '??'}
    </div>
  );
}
