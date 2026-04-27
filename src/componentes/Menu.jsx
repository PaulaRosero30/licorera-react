import React from 'react';
import { Link } from 'react-router-dom';
import './Menu.css';

export default function Menu() {
  return (
    <div className="menu-container">
      <h1>🍺 Sistema Licorera</h1>
      <p className="subtitle">Gestión integral para tu negocio</p>

      <div className="menu-grid">
        <Link to="/inventario" className="menu-item">
          <span className="emoji">📦</span>
          <span>Inventario</span>
        </Link>
        <Link to="/proveedores" className="menu-item">
          <span className="emoji">🚚</span>
          <span>Proveedores</span>
        </Link>
        <Link to="/ventas" className="menu-item">
          <span className="emoji">💰</span>
          <span>Ventas</span>
        </Link>
        <Link to="/clientes" className="menu-item">
          <span className="emoji">👥</span>
          <span>Clientes</span>
        </Link>
        <Link to="/mesas" className="menu-item">
          <span className="emoji">🪑</span>
          <span>Mesas</span>
        </Link>
        <Link to="/informes" className="menu-item">
          <span className="emoji">📊</span>
          <span>Informes</span>
        </Link>
      </div>
    </div>
  );
}