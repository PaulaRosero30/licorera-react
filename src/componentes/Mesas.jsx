import React, { useState, useEffect } from 'react';
import { mesasAPI, productosAPI } from '../api/servicios';
import './Mesas.css';

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mesaActual, setMesaActual] = useState(null);
  const [detallesMesa, setDetallesMesa] = useState([]);
  const [personaActual, setPersonaActual] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarCerrar, setMostrarCerrar] = useState(false);
  const [nuevaMesa, setNuevaMesa] = useState('');
  const [cargando, setCargando] = useState(true);

  const [formProducto, setFormProducto] = useState({
    persona_nombre: '',
    producto_id: '',
    cantidad: 1
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [mesasRes, prodRes] = await Promise.all([
        mesasAPI.activas(),
        productosAPI.obtener()
      ]);
      setMesas(mesasRes.data);
      setProductos(prodRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const abrirMesa = async () => {
    if (!nuevaMesa.trim()) {
      alert('Escribe el nombre de la mesa');
      return;
    }
    try {
      await mesasAPI.crear({ numero: nuevaMesa });
      setNuevaMesa('');
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const seleccionarMesa = async (mesa) => {
    try {
      const res = await mesasAPI.detalles(mesa.id);
      setMesaActual(mesa);
      setDetallesMesa(res.data);
      const personas = [...new Set(res.data.map(d => d.persona))];
      if (personas.length > 0) {
        setPersonaActual(personas[0]);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const agregarProducto = async () => {
    if (!mesaActual || !formProducto.persona_nombre || !formProducto.producto_id) {
      alert('Completa todos los campos');
      return;
    }

    const prod = productos.find(p => p.id === Number(formProducto.producto_id));
    try {
      await mesasAPI.agregar(mesaActual.id, {
        producto_id: Number(formProducto.producto_id),
        cantidad: Number(formProducto.cantidad),
        precio_unitario: prod.precio_venta,
        persona: formProducto.persona_nombre
      });
      setFormProducto({ persona_nombre: '', producto_id: '', cantidad: 1 });
      setMostrarModal(false);
      seleccionarMesa(mesaActual);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const quitarProducto = async (detalleId) => {
    try {
      await mesasAPI.eliminar(mesaActual.id, detalleId);
      seleccionarMesa(mesaActual);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const cerrarMesa = async () => {
    const personas = [...new Set(detallesMesa.map(d => d.persona))];
    const pagos = {};

    for (const persona of personas) {
      const medio = prompt(`${persona} - Medio de pago (efectivo/transferencia/tarjeta):`);
      if (!medio) return;
      pagos[persona] = { persona, medio_pago: medio, banco: null };
    }

    try {
      await mesasAPI.cerrar(mesaActual.id, { pagos: Object.values(pagos) });
      alert('✅ Mesa cerrada correctamente');
      setMesaActual(null);
      setPersonaActual(null);
      setDetallesMesa([]);
      setMostrarCerrar(false);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const personasEnMesa = [...new Set(detallesMesa.map(d => d.persona))];
  const itemsPersona = detallesMesa.filter(d => d.persona === personaActual);
  const totalPersona = itemsPersona.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  if (!mesaActual) {
    return (
      <div className="contenedor">
        <h2>🪑 Mesas</h2>
        <div className="barra-nueva-mesa">
          <input
            type="text"
            value={nuevaMesa}
            onChange={(e) => setNuevaMesa(e.target.value)}
            placeholder="Nombre de la mesa (Ej: Mesa 1, VIP)..."
          />
          <button className="btn btn-gold" onClick={abrirMesa}>+ Abrir Mesa</button>
        </div>

        <div className="mesas-grid">
          {mesas.length === 0 ? (
            <p className="vacio">No hay mesas abiertas</p>
          ) : (
            mesas.map(m => (
              <div
                key={m.id}
                className="mesa-card"
                onClick={() => seleccionarMesa(m)}
              >
                <div className="mesa-numero">{m.numero}</div>
                <div className="mesa-info">{m.productos || 0} productos</div>
                <div className="mesa-total">${Number(m.total || 0).toLocaleString('es-CO')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-mesa-layout">
      <button className="btn btn-rojo" onClick={() => setMesaActual(null)} style={{ marginBottom: '16px' }}>
        ← Volver
      </button>

      <h2>Mesa: {mesaActual.numero}</h2>

      <div className="personas-tabs">
        {personasEnMesa.length === 0 ? (
          <p>Sin productos aún</p>
        ) : (
          personasEnMesa.map(persona => (
            <button
              key={persona}
              className={`persona-tab ${personaActual === persona ? 'activa' : ''}`}
              onClick={() => setPersonaActual(persona)}
            >
              {persona}
            </button>
          ))
        )}
      </div>

      {personaActual && (
        <>
          <table className="tabla-detalle">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itemsPersona.length === 0 ? (
                <tr><td colSpan="5" className="vacio">Sin productos</td></tr>
              ) : (
                itemsPersona.map(item => (
                  <tr key={item.id}>
                    <td>{item.producto_nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
                    <td><strong>${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}</strong></td>
                    <td>
                      <button
                        className="btn btn-sm btn-rojo"
                        onClick={() => quitarProducto(item.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="total-persona">
            <span>Total {personaActual}:</span>
            <span className="monto">${totalPersona.toLocaleString('es-CO')}</span>
          </div>
        </>
      )}

      <button
        className="btn btn-gold"
        onClick={() => setMostrarModal(true)}
        style={{ marginTop: '16px', marginRight: '8px' }}
      >
        + Agregar Producto
      </button>
      <button
        className="btn btn-verde"
        onClick={() => setMostrarCerrar(true)}
        style={{ marginTop: '16px' }}
      >
        ✅ Cerrar Mesa
      </button>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agregar Producto</h2>
            <div className="campo">
              <label>Persona</label>
              <input
                type="text"
                value={formProducto.persona_nombre}
                onChange={(e) => setFormProducto({ ...formProducto, persona_nombre: e.target.value })}
                placeholder="Ej: Juan, María..."
              />
            </div>
            <div className="campo">
              <label>Producto</label>
              <select
                value={formProducto.producto_id}
                onChange={(e) => setFormProducto({ ...formProducto, producto_id: e.target.value })}
              >
                <option value="">Selecciona...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} - ${Number(p.precio_venta).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={formProducto.cantidad}
                onChange={(e) => setFormProducto({ ...formProducto, cantidad: Number(e.target.value) })}
              />
            </div>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={agregarProducto}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarCerrar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Cerrar Mesa</h2>
            <p>Se solicitará el medio de pago para cada persona.</p>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarCerrar(false)}>Cancelar</button>
              <button className="btn btn-verde" onClick={cerrarMesa}>Procesar Cierre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}