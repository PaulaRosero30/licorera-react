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
  const [nuevaCuenta, setNuevaCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('mesa');
  const [cargando, setCargando] = useState(true);
  const [pagos, setPagos] = useState({});

  const [formProducto, setFormProducto] = useState({
    persona_nombre: '', producto_id: '', cantidad: 1
  });

  useEffect(() => { cargarDatos(); }, []);

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

  const abrirCuenta = async () => {
    if (!nuevaCuenta.trim()) { alert('Escribe el nombre de la cuenta'); return; }
    try {
      await mesasAPI.crear({ numero: nuevaCuenta, tipo: tipoCuenta });
      setNuevaCuenta('');
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
      if (personas.length > 0) setPersonaActual(personas[0]);
      else setPersonaActual(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const agregarProducto = async () => {
    if (!mesaActual || !formProducto.persona_nombre || !formProducto.producto_id) {
      alert('Completa todos los campos'); return;
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

  const abrirCerrar = () => {
    const personas = [...new Set(detallesMesa.map(d => d.persona))];
    const pagosIniciales = {};
    personas.forEach(p => {
      const totalP = detallesMesa
        .filter(d => d.persona === p)
        .reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);
      pagosIniciales[p] = {
        persona: p,
        pagos: [{ medio_pago: 'efectivo', banco: '', monto: totalP }]
      };
    });
    setPagos(pagosIniciales);
    setMostrarCerrar(true);
  };

  const agregarPago = (persona) => {
    setPagos({
      ...pagos,
      [persona]: {
        ...pagos[persona],
        pagos: [...pagos[persona].pagos, { medio_pago: 'efectivo', banco: '', monto: 0 }]
      }
    });
  };

  const quitarPago = (persona, idx) => {
    const nuevos = pagos[persona].pagos.filter((_, i) => i !== idx);
    setPagos({ ...pagos, [persona]: { ...pagos[persona], pagos: nuevos } });
  };

  const actualizarPago = (persona, idx, campo, valor) => {
    const nuevos = [...pagos[persona].pagos];
    nuevos[idx] = { ...nuevos[idx], [campo]: valor };
    setPagos({ ...pagos, [persona]: { ...pagos[persona], pagos: nuevos } });
  };

  const calcularTotalPagado = (persona) => {
    return (pagos[persona]?.pagos || []).reduce((acc, p) => acc + Number(p.monto || 0), 0);
  };

  const calcularTotalPersona = (persona) => {
    return detallesMesa
      .filter(d => d.persona === persona)
      .reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);
  };

  const cerrarMesa = async () => {
    const personas = [...new Set(detallesMesa.map(d => d.persona))];
    for (const persona of personas) {
      const total = calcularTotalPersona(persona);
      const pagado = calcularTotalPagado(persona);
      if (pagado < total) {
        if (!window.confirm(`${persona} debe $${total.toLocaleString('es-CO')} pero solo ha pagado $${pagado.toLocaleString('es-CO')}. ¿Cerrar igual como pendiente?`)) return;
      }
    }
    try {
      await mesasAPI.cerrar(mesaActual.id, { pagos: Object.values(pagos) });
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
  const totalPersona = itemsPersona.reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);
  const totalMesa = detallesMesa.reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  if (!mesaActual) {
    return (
      <div className="contenedor">
        <h2>🪑 Mesas y Cuentas</h2>
        <div className="barra-nueva-mesa">
          <select
            value={tipoCuenta}
            onChange={(e) => setTipoCuenta(e.target.value)}
            className="select-tipo"
          >
            <option value="mesa">🪑 Mesa</option>
            <option value="cliente">👤 Cliente Frecuente</option>
          </select>
          <input
            type="text"
            value={nuevaCuenta}
            onChange={(e) => setNuevaCuenta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && abrirCuenta()}
            placeholder={tipoCuenta === 'mesa' ? 'Ej: Mesa 1, VIP...' : 'Ej: Adriana, Abraham...'}
          />
          <button className="btn btn-gold" onClick={abrirCuenta}>+ Abrir Cuenta</button>
        </div>

        {mesas.length === 0 ? (
          <p className="vacio">No hay cuentas abiertas</p>
        ) : (
          <div className="mesas-grid">
            {mesas.map(m => (
              <div key={m.id} className="mesa-card" onClick={() => seleccionarMesa(m)}>
                <div className="mesa-icono">{m.numero.match(/^[A-Za-záéíóúÁÉÍÓÚ]/) ? '👤' : '🪑'}</div>
                <div className="mesa-numero">{m.numero}</div>
                <div className="mesa-info">{m.productos || 0} productos</div>
                <div className="mesa-total">${Number(m.total || 0).toLocaleString('es-CO')}</div>
                <div className="mesa-estado">Abierta</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="contenedor">
      <div className="detalle-header">
        <button className="btn btn-sm" onClick={() => setMesaActual(null)}>← Volver</button>
        <h2>🪑 {mesaActual.numero}</h2>
        <div className="detalle-acciones">
          <button className="btn btn-gold" onClick={() => setMostrarModal(true)}>+ Agregar Producto</button>
          <button className="btn btn-verde" onClick={abrirCerrar}>✅ Cerrar Cuenta</button>
        </div>
      </div>

      <div className="mesa-resumen">
        <div className="resumen-dato">
          <span>Total cuenta</span>
          <strong>${totalMesa.toLocaleString('es-CO')}</strong>
        </div>
        <div className="resumen-dato">
          <span>Personas</span>
          <strong>{personasEnMesa.length}</strong>
        </div>
        <div className="resumen-dato">
          <span>Productos</span>
          <strong>{detallesMesa.length}</strong>
        </div>
      </div>

      <div className="personas-tabs">
        {personasEnMesa.map(p => (
          <button
            key={p}
            className={`persona-tab ${personaActual === p ? 'activo' : ''}`}
            onClick={() => setPersonaActual(p)}
          >
            👤 {p} — ${calcularTotalPersona(p).toLocaleString('es-CO')}
          </button>
        ))}
      </div>

      {personaActual && (
        <div className="detalle-persona">
          <h3>Consumo de {personaActual}</h3>
          {itemsPersona.length === 0 ? (
            <p className="vacio">Sin productos</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cant.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itemsPersona.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.nombre}</strong></td>
                    <td>${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
                    <td>{item.cantidad}</td>
                    <td><strong>${(item.cantidad * Number(item.precio_unitario)).toLocaleString('es-CO')}</strong></td>
                    <td>
                      <button className="btn btn-sm btn-rojo" onClick={() => quitarProducto(item.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="total-persona">
            <span>Total {personaActual}:</span>
            <strong>${totalPersona.toLocaleString('es-CO')}</strong>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PRODUCTO */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>+ Agregar Producto</h2>
            <div className="campo">
              <label>Persona</label>
              <input
                type="text"
                value={formProducto.persona_nombre}
                onChange={(e) => setFormProducto({ ...formProducto, persona_nombre: e.target.value })}
                placeholder="Nombre de la persona..."
                list="personas-list"
              />
              <datalist id="personas-list">
                {personasEnMesa.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="campo">
              <label>Producto</label>
              <select
                value={formProducto.producto_id}
                onChange={(e) => setFormProducto({ ...formProducto, producto_id: e.target.value })}
              >
                <option value="">Selecciona un producto...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — ${Number(p.precio_venta).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Cantidad</label>
              <input
                type="number" min="1"
                value={formProducto.cantidad}
                onChange={(e) => setFormProducto({ ...formProducto, cantidad: e.target.value })}
              />
            </div>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={agregarProducto}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR CUENTA */}
      {mostrarCerrar && (
        <div className="modal-overlay">
          <div className="modal modal-grande">
            <h2>✅ Cerrar Cuenta — {mesaActual.numero}</h2>
            <p style={{ color: '#aaa', marginBottom: '16px' }}>Registra los pagos por persona:</p>

            {personasEnMesa.map(persona => {
              const totalP = calcularTotalPersona(persona);
              const pagado = calcularTotalPagado(persona);
              const pendiente = totalP - pagado;

              return (
                <div key={persona} className="pago-persona">
                  <div className="pago-header">
                    <span>👤 <strong>{persona}</strong></span>
                    <span style={{ color: '#f5a623' }}>Total: ${totalP.toLocaleString('es-CO')}</span>
                  </div>

                  {(pagos[persona]?.pagos || []).map((pago, idx) => (
                    <div key={idx} className="pago-linea">
                      <select
                        value={pago.medio_pago}
                        onChange={(e) => actualizarPago(persona, idx, 'medio_pago', e.target.value)}
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">📱 Transferencia</option>
                        <option value="tarjeta">💳 Tarjeta</option>
                      </select>
                      {pago.medio_pago === 'transferencia' && (
                        <select
                          value={pago.banco}
                          onChange={(e) => actualizarPago(persona, idx, 'banco', e.target.value)}
                        >
                          <option value="">Banco...</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Otro">Otro</option>
                        </select>
                      )}
                      <input
                        type="number"
                        value={pago.monto}
                        onChange={(e) => actualizarPago(persona, idx, 'monto', e.target.value)}
                        placeholder="Monto"
                        min="0"
                      />
                      {idx > 0 && (
                        <button className="btn btn-sm btn-rojo" onClick={() => quitarPago(persona, idx)}>✕</button>
                      )}
                    </div>
                  ))}

                  <button className="btn btn-sm" style={{ marginTop: '8px' }} onClick={() => agregarPago(persona)}>
                    + Agregar otro medio de pago
                  </button>

                  <div className={`saldo-resumen ${pendiente > 0 ? 'saldo-pendiente' : pendiente < 0 ? 'saldo-sobrante' : 'saldo-ok'}`}>
                    <span>Pagado: ${pagado.toLocaleString('es-CO')}</span>
                    <span>
                      {pendiente > 0 ? `⚠️ Falta: $${pendiente.toLocaleString('es-CO')}` :
                       pendiente < 0 ? `📈 Sobra: $${Math.abs(pendiente).toLocaleString('es-CO')}` :
                       '✅ Saldado'}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="total-cierre">
              <span>Total a cobrar:</span>
              <strong>${totalMesa.toLocaleString('es-CO')}</strong>
            </div>
            <div className="modal-botones">
              <button className="btn btn-sm" onClick={() => setMostrarCerrar(false)}>Cancelar</button>
              <button className="btn btn-verde" onClick={cerrarMesa}>✅ Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}