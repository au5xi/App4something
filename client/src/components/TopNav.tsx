import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Button from './Button';
import Badge from './Badge';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

function fmt(d: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const [next, setNext] = useState<any | null>(null);

  useEffect(() => {
    api.nextEvent().then((r) => setNext(r.event)).catch(() => setNext(null));
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white font-black">4</div>
          <div>
            <div className="text-sm font-extrabold leading-4">App 4 something</div>
            <div className="text-xs text-slate-500 leading-4">"Up 4 something"</div>
          </div>
        </div>

        <div className="hidden gap-2 md:flex">
          <NavLink to="/events" className={linkClass}>Events</NavLink>
          <NavLink to="/host" className={linkClass}>Host</NavLink>
          <NavLink to="/friends" className={linkClass}>Friends</NavLink>
          <NavLink to="/status" className={linkClass}>Status</NavLink>
          <NavLink to="/calendar" className={linkClass}>Calendar</NavLink>
          <NavLink to="/profile" className={linkClass}>Profile</NavLink>
        </div>

        <div className="flex items-center gap-2">
          {next?.id && (
            <NavLink to={`/events/${next.id}`} className="hidden lg:block">
              <Badge tone="blue">Next: {next.activity} • {fmt(next.startTime)}</Badge>
            </NavLink>
          )}
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <Button variant="secondary" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 px-3 pb-3 md:hidden overflow-x-auto">
        <NavLink to="/events" className={linkClass}>Events</NavLink>
        <NavLink to="/host" className={linkClass}>Host</NavLink>
        <NavLink to="/friends" className={linkClass}>Friends</NavLink>
        <NavLink to="/status" className={linkClass}>Status</NavLink>
        <NavLink to="/calendar" className={linkClass}>Calendar</NavLink>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
      </div>
    </div>
  );
}
