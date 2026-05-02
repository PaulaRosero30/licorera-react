import React, { useState, useEffect } from 'react';
import { usuariosAPI } from '../api/servicios';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '', usuario: '', password: '', rol: 'cajero'
  });

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await usuariosAPI.obtener();
      setUsuarios(res.data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = () => {
    setEditandoId(null);
    setForm({ nombre: '', usuario: '', password: '', rol: 'cajero' });
    setMostrarModal(true);
  };

  const editar = (u) => {
    setEditandoId(u.id);
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol });
    setMostrarModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.rol) { alert('Nombre y rol son requeridos'); return; }
    if (!editandoId && !form.password) { alert('La contraseña es requerida'); return; }
    if (!editandoId && !form.usuario) { alert('El usuario es requerido'); return; }
    try {
      if (editandoId) {
        await usuariosAPI.actualizar(editandoId, form);
      } else {
        await usuariosAPI.crear(form);
      }
      setMostrarModal(false);
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const cambiarEstado = async (u) => {
    const accion = u.activo ? 'inactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${accion} a ${u.nombre}?`)) return;
    try {
      await usuariosAPI.cambiarEstado(u.id, !u.activo);
      cargarUsuarios();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const cambiarForm = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const roles = ['admin', 'cajero', 'bodeguero'];

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
    <div className="contenedor">
      <h2>👤 Gestión de Usuarios</h2>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <h3>Total Usuarios</h3>
          <p>{usuarios.length}</p>
        </div>
        <div className="stat-card">
          <h3>Activos</h3>
          <p>{usuarios.filter(u => u.activo).length}</p>
        </div>
        <div className="stat-card">
          <h3>Inactivos</h3>
          <p>{usuarios.filter(u => !u.activo).length}</p>
        </div>
      </div>

      <div className="barra-busqueda">
        <button className="btn btn-gold" onClick={abrirModal}>+ Crear Usuario</button>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan="6" className="vacio">No hay usuarios</td></tr>
          ) : (
            usuarios.map(u => (
              <tr key={u.id}>
                <td><strong>{u.nombre}</strong></td>
                <td>{u.usuario}</td>
                <td>
                  <span className={`badge ${u.rol === 'admin' ? 'badge-peligro' : 'badge-ok'}`}>
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.activo ? 'badge-ok' : 'badge-alerta'}`}>
                    {u.activo ? '✅ Activo' : '⛔ Inactivo'}
                  </span>
                </td>
                <td>{new Date(u.creado_en).toLocaleDateString('es-CO')}</td>
                <td className="acciones">
                  <button className="btn btn-sm" onClick={() => editar(u)}>Editar</button>
                  <button
                    className={`btn btn-sm ${u.activo ? 'btn-rojo' : 'btn-verde'}`}
                    onClick={() => cambiarEstado(u)}
                  >
                    {u.activo ? 'Inactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editandoId ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <div className="campo">
              <label>Nombre completo *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={cambiarForm} placeholder="Ej: Juan Pérez" />
            </div>
            {!editandoId && (
              <div className="campo">
                <label>Nombre de usuario *</label>
                <input type="text" name="usuario" value={form.usuario} onChange={cambiarForm} placeholder="Ej: juanp" />
              </div>
            )}
            <div className="campo">
              <label>{editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
              <input type="password" name="password" value={form.password} onChange={cambiarForm} placeholder="••••••••" />
            </div>
            <div className="campo">
              <label>Rol *</label>
              <select name="rol" value={form.rol} onChange={cambiarForm}>
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}