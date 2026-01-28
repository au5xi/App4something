import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Avatar from '../components/Avatar';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  useEffect(() => {
    setBio(user?.bio || '');
    setAvatarUrl(user?.avatarUrl || '');
  }, [user?.bio, user?.avatarUrl]);

  const save = async () => {
    try {
      await api.updateProfile({ bio: bio || null, avatarUrl: avatarUrl || null });
      await refresh();
      alert('Profile updated');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Profile</h2>
        <p className="text-slate-600">Add a short bio and a profile picture URL.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} name={user?.name || 'User'} size={64} />
          <div>
            <div className="text-lg font-extrabold">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold">Avatar URL</label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="text-sm font-semibold">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Short bio (max 280 chars)" />
          </div>
          <Button onClick={save}>Save profile</Button>
        </div>
      </Card>
    </div>
  );
}
