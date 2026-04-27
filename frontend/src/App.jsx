// ============================================================================
// App.jsx — Layout principal con react-router-dom
// ============================================================================

import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import Boleteria from './pages/Boleteria';
import Catalogos from './pages/Catalogos';
import Viajes from './pages/Viajes';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            <span className="navbar-brand-icon">🚌</span>
            Mariscal Santa Cruz
          </NavLink>

          <ul className="navbar-links">
            <li>
              <NavLink
                to="/catalogos"
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                📋 Catálogos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/viajes"
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                🗓️ Viajes
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/boleteria"
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                🎫 Boletería
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <main className="app-main">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/boleteria" replace />} />
          <Route path="/catalogos" element={<Catalogos />} />
          <Route path="/viajes" element={<Viajes />} />
          <Route path="/boleteria" element={<Boleteria />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
