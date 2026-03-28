import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import EnrollPage from './pages/EnrollPage';
import VerificationPage from './pages/VerificationPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/enroll" element={<EnrollPage />} />
              <Route path="/verify" element={<VerificationPage />} />
              <Route path="/result/:id" element={<ResultPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
