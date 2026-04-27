import React, { useState, useEffect } from 'react';
import { proveedoresAPI } from '../api/servicios';
import './Proveedores.css';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [buscador, setBuscador] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [eliminarId, setEliminarId] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    filtrar();
  }, [proveedores, buscador]);

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const response = await proveedoresAPI.obtener();
      setProveedores(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar proveedores: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const filtrar = () => {
    let resultado = proveedores;
    
    if (buscador) {
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(buscador.toLowerCase()) ||
        (p.nit || '').includes(buscador)
      );
    }

    setFiltrados(resultado);
  };

  const abrirModal = () => {
    setEditandoId(null);
    setForm({
      nombre: '',
      nit: '',
      telefono: '',
      correo: '',
      direccion: ''
    });
    setMostrarModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      if (editandoId) {
        await proveedoresAPI.actualizar(editandoId, form);
      } else {
        await proveedoresAPI.crear(form);
      }
      setMostrarModal(false);
      cargarProveedores();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const editar = (proveedor) => {
    setEditandoId(proveedor.id);
    setForm(proveedor);
    setMostrarModal(true);
  };

  const abrirConfirm = (id) => {
    setEliminarId(id);
    setMostrarConfirm(true);
  };

  const confirmarEliminar = async () => {
    try {
      await proveedoresAPI.eliminar(eliminarId);
      setMostrarConfirm(false);
      setEliminarId(null);
      cargarProveedores();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const cambiarForm = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const stats = {
    total: proveedores.length,
    conPedidos: proveedores.filter(p => p.total_pedidos > 0).length
  };

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
    <div className="contenedor">
      <h2>🚚 Gestión de Proveedores</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Proveedores</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Con Pedidos</h3>
          <p>{stats.conPedidos}</p>
        </div>
      </div>

      <div className="barra-busqueda">
        <input
          type="text"
          placeholder="🔍 Buscar proveedor..."
          value={buscador}
          onChange={(e) => setBuscador(e.target.value)}
        />
        <button className="btn btn-gold" onClick={abrirModal}>+ Agregar Proveedor</button>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>NIT</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Dirección</th>
            <th>Pedidos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr><td colSpan="7" className="vacio">No hay proveedores</td></tr>
          ) : (
            filtrados.map(p => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.nit || '—'}</td>
                <td>{p.telefono || '—'}</td>
                <td>{p.correo || '—'}</td>
                <td>{p.direccion || '—'}</td>
                <td style={{ textAlign: 'center' }}>{p.total_pedidos || 0}</td>
                <td className="acciones">
                  <button className="btn btn-sm" onClick={() => editar(p)}>Editar</button>
                  <button className="btn btn-sm btn-rojo" onClick={() => abrirConfirm(p.id)}>Inactivar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL AGREGAR/EDITAR */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editandoId ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
            
            <div className="campo">
              <label>Nombre *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={cambiarForm} />
            </div>
            <div className="campo">
              <label>NIT</label>
              <input type="text" name="nit" value={form.nit} onChange={cambiarForm} placeholder="Ej: 900123456-1" />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input type="text" name="telefono" value={form.telefono} onChange={cambiarForm} placeholder="Ej: 3001234567" />
            </div>
            <div className="campo">
              <label>Correo</label>
              <input type="email" name="correo" value={form.correo} onChange={cambiarForm} placeholder="Ej: ventas@proveedor.com" />
            </div>
            <div className="campo">
              <label>Dirección</label>
              <input type="text" name="direccion" value={form.direccion} onChange={cambiarForm} placeholder="Ej: Calle 10 # 20-30" />
            </div>

            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {mostrarConfirm && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <p>¿Seguro que quieres inactivar este proveedor?</p>
            <div className="modal-botones">
              <button className="btn btn-azul" onClick={() => setMostrarConfirm(false)}>Cancelar</button>
              <button className="btn btn-rojo" onClick={confirmarEliminar}>Sí, inactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}