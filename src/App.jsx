import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useHiddenPages } from './hooks/useHiddenPages.js';
import { pageKeyByPath } from './lib/pages.js';

import Login     from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Today     from './screens/Today.jsx';
import Inbox     from './screens/Inbox.jsx';
import Calendar  from './screens/Calendar.jsx';
import Notes     from './screens/Notes.jsx';
import Journal   from './screens/Journal.jsx';
import Files     from './screens/Files.jsx';
import Finances  from './screens/Finances.jsx';
import CRM       from './screens/CRM.jsx';
import Kanban    from './screens/Kanban.jsx';
import Gantt     from './screens/Gantt.jsx';
import Goals     from './screens/Goals.jsx';
import Projects       from './screens/Projects.jsx';
import ProjectDetail  from './screens/ProjectDetail.jsx';
import Settings  from './screens/Settings.jsx';
import Vault        from './screens/Vault.jsx';
import Cinema       from './screens/Cinema.jsx';
import CinemaPublic from './screens/CinemaPublic.jsx';
import PersonalCar  from './screens/PersonalCar.jsx';
import PersonalGirl from './screens/PersonalGirl.jsx';
import PersonalHome from './screens/PersonalHome.jsx';
import { PrivacyPolicy, Terms } from './screens/Legal.jsx';
import Admin from './screens/Admin.jsx';
import Landing from './screens/Landing.jsx';
import ResetPassword from './screens/ResetPassword.jsx';

/* admin.nexoraos.ru живёт в том же бандле, но со своим набором роутов */
const IS_ADMIN_HOST = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');

/* Redirects to /login if not authenticated; shows spinner while loading session */
function AuthGuard() {
  const { session, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <HiddenPageGuard />;
}

/* Отключённая в настройках страница → редирект на дашборд */
function HiddenPageGuard() {
  const { pathname } = useLocation();
  const { data: hidden = [] } = useHiddenPages();

  const key = pageKeyByPath(pathname);
  if (key && hidden.includes(key)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* Redirects logged-in users away from /login */
function GuestGuard() {
  const { session, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* Корень: гостям — лендинг, залогиненным — дашборд */
function RootGate() {
  const { session, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

function AppLoader() {
  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 60%, var(--bg)), color-mix(in oklab, var(--p-youmin) 60%, var(--bg)))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 600, color: 'var(--text)',
        animation: 'pulse 1.2s ease-in-out infinite',
      }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
        N
      </div>
    </div>
  );
}

export default function App() {
  /* Отдельный домен админки: только логин и панель */
  if (IS_ADMIN_HOST) {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<AuthGuard />}>
            <Route path="/" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Fully public — no auth required */}
        <Route path="/" element={<RootGate />} />
        <Route path="/cinema/public/:userId" element={<CinemaPublic />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms"   element={<Terms />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/today"     element={<Today />} />
          <Route path="/inbox"     element={<Inbox />} />
          <Route path="/calendar"  element={<Calendar />} />
          <Route path="/notes"     element={<Notes />} />
          <Route path="/journal"   element={<Journal />} />
          <Route path="/files"     element={<Files />} />
          <Route path="/finances"  element={<Finances />} />
          <Route path="/crm"       element={<CRM />} />
          <Route path="/kanban"    element={<Kanban />} />
          <Route path="/gantt"     element={<Gantt />} />
          <Route path="/goals"     element={<Goals />} />
          <Route path="/projects"      element={<Projects />} />
          <Route path="/projects/:id"  element={<ProjectDetail />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/vault"     element={<Vault />} />
          <Route path="/cinema"    element={<Cinema />} />
          <Route path="/personal/car"     element={<PersonalCar />} />
          <Route path="/personal/partner" element={<PersonalGirl />} />
          <Route path="/personal/home"    element={<PersonalHome />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
