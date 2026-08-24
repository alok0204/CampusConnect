import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Phase 1 Pages
import Login from './pages/Login';
import StudentSignup from './pages/StudentSignup';
import FacultySignup from './pages/FacultySignup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Phase 2: Events Pages
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import EventDetails from './pages/EventDetails';
import AdminEvents from './pages/AdminEvents';

// Phase 3: Lost & Found Pages
import LostFound from './pages/LostFound';
import CreateLostFound from './pages/CreateLostFound';
import MyLostFound from './pages/MyLostFound';
import LostFoundDetails from './pages/LostFoundDetails';
import AdminLostFound from './pages/AdminLostFound';

// Phase 4: Announcements Pages
import Announcements from './pages/Announcements';
import CreateAnnouncement from './pages/CreateAnnouncement';
import ManageAnnouncements from './pages/ManageAnnouncements';
import AnnouncementDetails from './pages/AnnouncementDetails';
import AdminAnnouncements from './pages/AdminAnnouncements';

// Phase 5: Clubs Pages
import Clubs from './pages/Clubs';
import CreateClub from './pages/CreateClub';
import MyClubs from './pages/MyClubs';
import ClubDetails from './pages/ClubDetails';
import AdminClubs from './pages/AdminClubs';

// Phase 6: Notifications Page
import Notifications from './pages/Notifications';

// Master Admin Console (Phase 7)
import AdminOverview from './pages/AdminOverview';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup/student" element={<StudentSignup />} />
          <Route path="/signup/faculty" element={<FacultySignup />} />
          <Route path="/signup" element={<Navigate to="/signup/student" replace />} />

          {/* Authenticated Dashboard Shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Events Module Routes (Phase 2) */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/create" element={<CreateEvent />} />
            <Route path="/events/my-events" element={<MyEvents />} />
            <Route path="/events/:id" element={<EventDetails />} />

            {/* Lost & Found Module Routes (Phase 3) */}
            <Route path="/lost-found" element={<LostFound />} />
            <Route path="/lost-found/create" element={<CreateLostFound />} />
            <Route path="/lost-found/my-reports" element={<MyLostFound />} />
            <Route path="/lost-found/:id" element={<LostFoundDetails />} />

            {/* Announcements Module Routes (Phase 4) */}
            <Route path="/announcements" element={<Announcements />} />
            <Route
              path="/announcements/create"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <CreateAnnouncement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/manage"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <ManageAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route path="/announcements/:id" element={<AnnouncementDetails />} />

            {/* Clubs Module Routes (Phase 5) */}
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/create" element={<CreateClub />} />
            <Route path="/clubs/my-clubs" element={<MyClubs />} />
            <Route path="/clubs/:id" element={<ClubDetails />} />

            {/* Notifications & Activity Center (Phase 6) */}
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin Management Routes */}
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lost-found"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLostFound />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clubs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminClubs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminOverview />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
