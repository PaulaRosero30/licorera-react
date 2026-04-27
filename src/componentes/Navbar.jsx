import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-header">
        <Link to="/" className="navbar-title">🍺 Licorera</Link>
      </div>
      <div className="navbar-links">
        <Link to="/inventario" className="nav-link">📦 Inventario</Link>
        <Link to="/proveedores" className="nav-link">🚚 Proveedores</Link>
        <Link to="/ventas" className="nav-link">💰 Ventas</Link>
        <Link to="/clientes" className="nav-link">👥 Clientes</Link>
        <Link to="/mesas" className="nav-link">🪑 Mesas</Link>
        <Link to="/informes" className="nav-link">📊 Informes</Link>
      </div>
    </nav>
  );
}