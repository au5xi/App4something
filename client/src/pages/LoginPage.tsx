import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      nav('/events');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white text-2xl font-black">4</div>
        <h1 className="text-2xl font-extrabold">App 4 something</h1>
        <p className="text-slate-600">Sign in to see your invites and host something.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div>
          <label className="text-sm font-semibold">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <Button disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
        <div className="text-center text-sm text-slate-600">
          No account? <Link className="font-semibold text-slate-900" to="/register">Create one</Link>
        </div>
      </form>
    </div>
  );
}
