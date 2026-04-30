import React, { useState, useEffect } from 'react';
import { clientesAPI } from '../api/servicios';
import './Clientes.css';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [buscador, setBuscador] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarAbono, setMostrarAbono] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteActual, setClienteActual] = useState(null);
  const [detallesCliente, setDetallesCliente] = useState(null);
  const [ventaAbonar, setVentaAbonar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '', documento: '', telefono: '', limite_credito: ''
  });

  const [formAbono, setFormAbono] = useState({
    monto: '', medio_pago: 'efectivo', banco: ''
  });

  useEffect(() => { cargarClientes(); }, []);
  useEffect(() => { filtrar(); }, [clientes, buscador]);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const response = await clientesAPI.obtener();
      setClientes(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar clientes: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const filtrar = () => {
    let resultado = clientes;
    if (buscador) {
      resultado = resultado.filter(c =>
        c.nombre.toLowerCase().includes(buscador.toLowerCase()) ||
        (c.documento || '').includes(buscador)
      );
    }
    setFiltrados(resultado);
  };

  const abrirModal = () => {
    setEditandoId(null);
    setForm({ nombre: '', documento: '', telefono: '', limite_credito: '' });
    setMostrarModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) { alert('El nombre es obligatorio'); return; }
    try {
      if (editandoId) {
        await clientesAPI.actualizar(editandoId, form);
      } else {
        await clientesAPI.crear(form);
      }
      setMostrarModal(false);
      cargarClientes();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const editar = (cliente) => {
    setEditandoId(cliente.id);
    setForm(cliente);
    setMostrarModal(true);
  };

  const verDetalles = async (cliente) => {
    try {
      const response = await clientesAPI.detalles(cliente.id);
      setClienteActual(cliente);
      setDetallesCliente(response.data);
      setMostrarDetalles(true);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirAbono = (venta) => {
    setVentaAbonar(venta);
    setFormAbono({ monto: '', medio_pago: 'efectivo', banco: '' });
    setMostrarAbono(true);
  };

  const registrarAbono = async () => {
    if (!formAbono.monto || isNaN(formAbono.monto) || formAbono.monto <= 0) {
      alert('Ingresa un monto válido'); return;
    }
    if (Number(formAbono.monto) > Number(ventaAbonar.total)) {
      alert('El abono no puede ser mayor a la deuda'); return;
    }
    try {
      await clientesAPI.abono(clienteActual.id, {
        venta_id: ventaAbonar.id,
        monto: formAbono.monto,
        medio_pago: formAbono.medio_pago,
        banco: formAbono.banco || null
      });
      setMostrarAbono(false);
      verDetalles(clienteActual);
      cargarClientes();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const cambiarForm = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const stats = {
    total: clientes.length,
    conDeuda: clientes.filter(c => c.saldo_deuda > 0).length,
    totalDeuda: clientes.reduce((acc, c) => acc + Number(c.saldo_deuda), 0)
  };

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
    <div className="contenedor">
      <h2>👥 Gestión de Clientes</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Clientes</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Con Deuda</h3>
          <p>{stats.conDeuda}</p>
        </div>
        <div className="stat-card alerta">
          <h3>💳 Total Adeudado</h3>
          <p>${stats.totalDeuda.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div className="barra-busqueda">
        <input
          type="text"
          placeholder="🔍 Buscar cliente..."
          value={buscador}
          onChange={(e) => setBuscador(e.target.value)}
        />
        <button className="btn btn-gold" onClick={abrirModal}>+ Agregar Cliente</button>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Saldo Deuda</th>
            <th>Límite Crédito</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr><td colSpan="7" className="vacio">No hay clientes</td></tr>
          ) : (
            filtrados.map(c => (
              <tr key={c.id}>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.documento || '—'}</td>
                <td>{c.telefono || '—'}</td>
                <td style={{ color: c.saldo_deuda > 0 ? '#e74c3c' : '#2ecc71' }}>
                  <strong>${Number(c.saldo_deuda).toLocaleString('es-CO')}</strong>
                </td>
                <td>${Number(c.limite_credito).toLocaleString('es-CO')}</td>
                <td>
                  <span className={`badge ${
                    c.saldo_deuda > c.limite_credito ? 'badge-peligro' :
                    c.saldo_deuda > 0 ? 'badge-alerta' : 'badge-ok'
                  }`}>
                    {c.saldo_deuda > c.limite_credito ? '⚠️ Límite excedido' :
                     c.saldo_deuda > 0 ? 'Con deuda' : '✅ Al día'}
                  </span>
                </td>
                <td className="acciones">
                  <button className="btn btn-sm" onClick={() => verDetalles(c)}>Ver deudas</button>
                  <button className="btn btn-sm" onClick={() => editar(c)}>Editar</button>
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
            <h2>{editandoId ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
            <div className="campo">
              <label>Nombre *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={cambiarForm} />
            </div>
            <div className="campo">
              <label>Documento (CC/NIT)</label>
              <input type="text" name="documento" value={form.documento || ''} onChange={cambiarForm} placeholder="Ej: 12345678" />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input type="text" name="telefono" value={form.telefono || ''} onChange={cambiarForm} placeholder="Ej: 3001234567" />
            </div>
            <div className="campo">
              <label>Límite de Crédito ($)</label>
              <input type="number" name="limite_credito" value={form.limite_credito || ''} onChange={cambiarForm} placeholder="0" min="0" />
            </div>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {mostrarDetalles && detallesCliente && (
        <div className="modal-overlay">
          <div className="modal modal-grande">
            <div className="detalle-header">
              <h2>👤 {clienteActual.nombre}</h2>
              <div className="detalle-info">
                <div className="detalle-dato">
                  <span className="label">Documento</span>
                  <span className="valor">{clienteActual.documento || '—'}</span>
                </div>
                <div className="detalle-dato">
                  <span className="label">Teléfono</span>
                  <span className="valor">{clienteActual.telefono || '—'}</span>
                </div>
                <div className="detalle-dato">
                  <span className="label">Saldo Actual</span>
                  <span className="valor" style={{ color: '#f5a623' }}>
                    ${Number(clienteActual.saldo_deuda).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="detalle-dato">
                  <span className="label">Límite Crédito</span>
                  <span className="valor">${Number(clienteActual.limite_credito).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <h3 style={{ color: '#f5a623', margin: '16px 0 10px' }}>Deudas Pendientes</h3>
            {detallesCliente.deudas.length === 0 ? (
              <p className="vacio">✅ Sin deudas pendientes</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Venta #</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesCliente.deudas.map(d => (
                    <tr key={d.id}>
                      <td><strong>#{d.id}</strong></td>
                      <td>${Number(d.total).toLocaleString('es-CO')}</td>
                      <td>
                        <span className={`badge ${d.estado === 'pagada' ? 'badge-ok' : 'badge-alerta'}`}>
                          {d.estado}
                        </span>
                      </td>
                      <td>{new Date(d.fecha).toLocaleDateString('es-CO')}</td>
                      <td>
                        {d.estado !== 'pagada'
                          ? <button className="btn btn-sm btn-gold" onClick={() => abrirAbono(d)}>Abonar</button>
                          : <span style={{ color: '#2ecc71' }}>✅ Pagada</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarDetalles(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {mostrarAbono && ventaAbonar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>💰 Registrar Abono</h2>
            <div className="abono-info">
              <p>Venta <strong>#{ventaAbonar.id}</strong></p>
              <p>Deuda total: <strong style={{ color: '#e74c3c' }}>${Number(ventaAbonar.total).toLocaleString('es-CO')}</strong></p>
            </div>
            <div className="campo">
              <label>Monto a abonar ($)</label>
              <input
                type="number"
                value={formAbono.monto}
                onChange={(e) => setFormAbono({ ...formAbono, monto: e.target.value })}
                placeholder="0"
                min="0"
                max={ventaAbonar.total}
              />
            </div>
            <div className="campo">
              <label>Medio de pago</label>
              <select
                value={formAbono.medio_pago}
                onChange={(e) => setFormAbono({ ...formAbono, medio_pago: e.target.value })}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">📱 Transferencia</option>
                <option value="tarjeta">💳 Tarjeta</option>
              </select>
            </div>
            {formAbono.medio_pago === 'transferencia' && (
              <div className="campo">
                <label>Banco/Plataforma</label>
                <select
                  value={formAbono.banco}
                  onChange={(e) => setFormAbono({ ...formAbono, banco: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Davivienda">Davivienda</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarAbono(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={registrarAbono}>✅ Confirmar Abono</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}