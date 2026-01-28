import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventPage from './pages/EventPage';
import HostPage from './pages/HostPage';
import FriendsPage from './pages/FriendsPage';
import StatusPage from './pages/StatusPage';
import ProfilePage from './pages/ProfilePage';
import CalendarPage from './pages/CalendarPage';
import TopNav from './components/TopNav';

function AuthedApp() {
  return (
    <div>
      <TopNav />
      <div className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/host" element={<HostPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-600">Loading…</div>;

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/*" element={<AuthedApp />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
