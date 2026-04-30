import React, { useState, useEffect } from 'react';
import Login from './componentes/Login';
import Ventas from './componentes/Ventas';
import Inventario from './componentes/Inventario';
import Clientes from './componentes/Clientes';
import Proveedores from './componentes/Proveedores';
import Mesas from './componentes/Mesas';
import Informes from './componentes/Informes';
import logo from './logo-licores.jpeg';
import './App.css';

function obtenerIniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [modulo, setModulo] = useState('ventas');

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    const foto = localStorage.getItem('fotoPerfil');
    if (usuarioGuardado && token) {
      setUsuario(JSON.parse(usuarioGuardado));
      if (foto) setFotoPerfil(foto);
    }
  }, []);

  const handleLogin = (usuarioData) => setUsuario(usuarioData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('fotoPerfil');
    setUsuario(null);
    setFotoPerfil(null);
  };

  const handleFoto = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setFotoPerfil(base64);
      localStorage.setItem('fotoPerfil', base64);
    };
    reader.readAsDataURL(archivo);
  };

  if (!usuario) return <Login onLogin={handleLogin} />;

  const menuAdmin = [
  { id: 'ventas', label: '🛒 Ventas' },
  { id: 'inventario', label: '📦 Inventario' },
  { id: 'clientes', label: '👥 Clientes' },
  { id: 'proveedores', label: '🚚 Proveedores' },
  { id: 'mesas', label: '🪑 Mesas' },
  { id: 'informes', label: '📊 Informes' },
];

  const menuEmpleado = [
    { id: 'ventas', label: '🛒 Ventas' },
  ];

  const menu = usuario.rol === 'admin' ? menuAdmin : menuEmpleado;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <img src={logo} alt="Licores L&P" className="header-logo-img" />
        </div>

        <nav className="header-nav">
          {menu.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${modulo === item.id ? 'nav-btn-activo' : ''}`}
              onClick={() => setModulo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-usuario">
          <div className="header-info">
            <span className="header-nombre">{usuario.nombre}</span>
            <span className="header-rol">{usuario.rol}</span>
          </div>
          <label className="avatar-wrapper" title="Cambiar foto">
            <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
            {fotoPerfil
              ? <img src={fotoPerfil} alt="perfil" className="avatar-foto" />
              : <div className="avatar-iniciales">{obtenerIniciales(usuario.nombre)}</div>
            }
          </label>
          <button onClick={handleLogout} className="btn-salir">Cerrar sesión</button>
        </div>
      </header>

      <main>
        {modulo === 'ventas' && <Ventas />}
        {modulo === 'inventario' && <Inventario />}
        {modulo === 'clientes' && <Clientes />}
        {modulo === 'proveedores' && <Proveedores />}
        {modulo === 'mesas' && <Mesas />}
        {modulo === 'informes' && <Informes />}
      </main>
    </div>
  );
}

export default App;