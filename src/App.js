import React, { useState, useEffect } from 'react';
import Login from './componentes/Login';
import Caja from './componentes/Caja';
import Ventas from './componentes/Ventas';
import Inventario from './componentes/Inventario';
import Clientes from './componentes/Clientes';
import Proveedores from './componentes/Proveedores';
import Mesas from './componentes/Mesas';
import Informes from './componentes/Informes';
import logo from './logo-licores.jpeg';
import { cajaAPI } from './api/servicios';
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
  const [etapa, setEtapa] = useState('login'); // 'login' | 'caja' | 'sistema' | 'cerrar'
  const [cajaInfo, setCajaInfo] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    const foto = localStorage.getItem('fotoPerfil');
    if (usuarioGuardado && token) {
      const u = JSON.parse(usuarioGuardado);
      setUsuario(u);
      if (foto) setFotoPerfil(foto);
      verificarCajaAlIngreso(u);
    }
  }, []);

  const verificarCajaAlIngreso = async (u) => {
    try {
      const res = await cajaAPI.estado(u.id);
      if (res.data.abierta) {
        setEtapa('sistema');
      } else {
        setEtapa('caja');
      }
    } catch {
      setEtapa('caja');
    }
  };

  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
    verificarCajaAlIngreso(usuarioData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('fotoPerfil');
    setUsuario(null);
    setFotoPerfil(null);
    setCajaInfo(null);
    setEtapa('login');
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

  const handleCajaAbierta = () => {
    setEtapa('sistema');
  };

  const handleCerrarCaja = async () => {
    try {
      const res = await cajaAPI.estado(usuario.id);
      if (res.data.abierta) {
        setCajaInfo(res.data.caja);
      }
    } catch {}
    setEtapa('cerrar');
  };

  const handleCajaCerrada = () => {
    setCajaInfo(null);
    setEtapa('caja');
  };

  if (etapa === 'login') return <Login onLogin={handleLogin} />;

  if (etapa === 'caja') return (
    <Caja
      usuario={usuario}
      modo="abrir"
      onCajaAbierta={handleCajaAbierta}
    />
  );

  if (etapa === 'cerrar') return (
  <Caja
    usuario={usuario}
    modo="cerrar"
    cajaInfoInicial={cajaInfo}
    onCajaCerrada={handleCajaCerrada}
    onCerrarSesion={handleLogout}
  />
);

  const esAdmin = usuario.rol === 'admin';

  const menu = [
    { id: 'ventas', label: '🛒 Ventas' },
    { id: 'inventario', label: '📦 Inventario' },
    { id: 'clientes', label: '👥 Clientes' },
    { id: 'proveedores', label: '🚚 Proveedores' },
    { id: 'mesas', label: '🪑 Mesas' },
    { id: 'informes', label: '📊 Informes' },
  ];

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
          <button onClick={handleCerrarCaja} className="btn-salir btn-caja-cerrar">🔒 Cerrar Caja</button>
          <button onClick={handleLogout} className="btn-salir">Cerrar sesión</button>
        </div>
      </header>
      <main>
        {modulo === 'ventas' && <Ventas />}
        {modulo === 'inventario' && <Inventario esAdmin={esAdmin} />}
        {modulo === 'clientes' && <Clientes esAdmin={esAdmin} />}
        {modulo === 'proveedores' && <Proveedores esAdmin={esAdmin} />}
        {modulo === 'mesas' && <Mesas />}
        {modulo === 'informes' && <Informes esAdmin={esAdmin} />}
      </main>
    </div>
  );
}

export default App;