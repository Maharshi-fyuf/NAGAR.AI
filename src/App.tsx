import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import IssuePage from './pages/IssuePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-slate-950 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/issue/:id" element={<IssuePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
