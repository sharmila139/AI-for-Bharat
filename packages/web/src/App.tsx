import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import Layout from './components/Layout';
import Home from './pages/Home';
import Agriculture from './pages/Agriculture';
import Health from './pages/Health';
import Education from './pages/Education';
import Infrastructure from './pages/Infrastructure';
import './App.css';

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agriculture" element={<Agriculture />} />
            <Route path="/health" element={<Health />} />
            <Route path="/education" element={<Education />} />
            <Route path="/infrastructure" element={<Infrastructure />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AccessibilityToolbar />
        </Layout>
      </Router>
    </AccessibilityProvider>
  );
}

export default App;
