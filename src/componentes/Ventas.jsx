import React, { useState, useEffect, useRef } from 'react';
import { productosAPI, ventasAPI, clientesAPI, mesasAPI } from '../api/servicios';
import './Ventas.css';

export default function Ventas() {
  const [vista, setVista] = useState('venta');
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [buscador, setBuscador] = useState('');
  const [listaProductos, setListaProductos] = useState([]);
  const [medioSeleccionado, setMedioSeleccionado] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [mesa, setMesa] = useState('');
  const [historial, setHistorial] = useState([]);
  const [banco, setBanco] = useState('');
  const [cargando, setCargando] = useState(true);
  const [dineroRecibido, setDineroRecibido] = useState('');
  const [reciboVisible, setReciboVisible] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [ventaAnular, setVentaAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  // Mesas
  const [mesas, setMesas] = useState([]);
  const [mesaActual, setMesaActual] = useState(null);
  const [detallesMesa, setDetallesMesa] = useState([]);
  const [personaActual, setPersonaActual] = useState(null);
  const [mostrarModalMesa, setMostrarModalMesa] = useState(false);
  const [mostrarCerrar, setMostrarCerrar] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('mesa');
  const [pagos, setPagos] = useState({});
  const [formProducto, setFormProducto] = useState({ persona_nombre: '', producto_id: '', cantidad: 1 });
  const reciboRef = useRef();

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [prodRes, clientRes, ventasRes, mesasRes] = await Promise.all([
        productosAPI.obtener(),
        clientesAPI.obtener(),
        ventasAPI.obtener(),
        mesasAPI.activas()
      ]);
      setProductos(prodRes.data);
      setClientes(clientRes.data);
      setHistorial(ventasRes.data);
      setMesas(mesasRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

  // ===== VENTAS =====
  const buscarProducto = async () => {
    if (!buscador.trim()) return;
    try {
      const resultado = await productosAPI.buscarPorCodigo(buscador);
      setListaProductos([resultado.data]);
    } catch (err) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(buscador.toLowerCase())
      );
      setListaProductos(filtrados);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find(i => i.producto_id === producto.id);
    if (existente) {
      existente.cantidad++;
      setCarrito([...carrito]);
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: Number(producto.precio_venta),
        cantidad: 1
      }]);
    }
    setBuscador('');
    setListaProductos([]);
  };

  const cambiarCantidad = (index, cantidad) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito[index].cantidad = Math.max(1, parseInt(cantidad) || 1);
    setCarrito(nuevoCarrito);
  };

  const quitarItem = (index) => setCarrito(carrito.filter((_, i) => i !== index));

  const limpiarCarrito = () => {
    setCarrito([]);
    setMedioSeleccionado('');
    setBanco('');
    setClienteSeleccionado('');
    setMesa('');
    setDineroRecibido('');
  };

  const calcularTotal = () => carrito.reduce((acc, i) => acc + (i.precio_unitario * i.cantidad), 0);

  const calcularVuelto = () => (parseFloat(dineroRecibido) || 0) - calcularTotal();

  const registrarVenta = async () => {
    if (carrito.length === 0) { alert('Agrega productos al carrito'); return; }
    if (!medioSeleccionado) { alert('Selecciona un medio de pago'); return; }
    if (medioSeleccionado === 'transferencia' && !banco) { alert('Selecciona el banco'); return; }
    if (medioSeleccionado === 'efectivo' && dineroRecibido && calcularVuelto() < 0) {
      alert('El dinero recibido es menor al total'); return;
    }
    try {
      const total = calcularTotal();
      const estado = clienteSeleccionado && medioSeleccionado !== 'efectivo' ? 'pendiente' : 'pagada';
      const clienteNombre = clientes.find(c => c.id === parseInt(clienteSeleccionado))?.nombre || null;

      const res = await ventasAPI.crear({
        cliente_id: clienteSeleccionado || null,
        items: carrito,
        medio_pago: medioSeleccionado,
        banco: banco || null,
        mesa: mesa || null,
        estado
      });

      setUltimaVenta({
        id: res.data.id,
        fecha: new Date().toLocaleString('es-CO'),
        items: [...carrito],
        total,
        medio_pago: medioSeleccionado,
        banco,
        mesa,
        cliente: clienteNombre,
        dineroRecibido: parseFloat(dineroRecibido) || 0,
        vuelto: medioSeleccionado === 'efectivo' ? calcularVuelto() : 0,
        estado
      });

      setReciboVisible(true);
      limpiarCarrito();
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirAnulacion = (venta) => {
    setVentaAnular(venta);
    setMotivoAnulacion('');
    setMostrarAnulacion(true);
  };

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) { alert('Ingresa un motivo de anulación'); return; }
    try {
      await ventasAPI.anular(ventaAnular.id, motivoAnulacion);
      setMostrarAnulacion(false);
      setVentaAnular(null);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al anular');
    }
  };

  const imprimirRecibo = () => {
    const contenido = reciboRef.current.innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    ventana.document.write(`
      <html><head><title>Recibo Licores L&P</title>
      <style>body{font-family:monospace;font-size:13px;padding:20px;color:#000;}h2{text-align:center;}p{margin:2px 0;}.linea{border-top:1px dashed #000;margin:8px 0;}table{width:100%;border-collapse:collapse;}td{padding:2px 4px;}</style>
      </head><body>${contenido}</body></html>
    `);
    ventana.document.close();
    ventana.print();
  };

  // ===== MESAS =====
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

  const seleccionarMesa = async (m) => {
    try {
      const res = await mesasAPI.detalles(m.id);
      setMesaActual(m);
      setDetallesMesa(res.data);
      const personas = [...new Set(res.data.map(d => d.persona))];
      setPersonaActual(personas.length > 0 ? personas[0] : null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const agregarProductoMesa = async () => {
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
      setMostrarModalMesa(false);
      seleccionarMesa(mesaActual);
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const quitarProductoMesa = async (detalleId) => {
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
      const totalP = detallesMesa.filter(d => d.persona === p).reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);
      pagosIniciales[p] = { persona: p, pagos: [{ medio_pago: 'efectivo', banco: '', monto: totalP }] };
    });
    setPagos(pagosIniciales);
    setMostrarCerrar(true);
  };

  const agregarPago = (persona) => {
    setPagos({ ...pagos, [persona]: { ...pagos[persona], pagos: [...pagos[persona].pagos, { medio_pago: 'efectivo', banco: '', monto: 0 }] } });
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

  const calcularTotalPagado = (persona) => (pagos[persona]?.pagos || []).reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const calcularTotalPersona = (persona) => detallesMesa.filter(d => d.persona === persona).reduce((acc, i) => acc + (i.cantidad * Number(i.precio_unitario)), 0);

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
  const total = calcularTotal();
  const items = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const vuelto = calcularVuelto();

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
    <div className="contenedor">
      {/* PESTAÑAS */}
      <div className="ventas-tabs">
        <button className={`venta-tab ${vista === 'venta' ? 'activo' : ''}`} onClick={() => setVista('venta')}>
          🛒 Venta Directa
        </button>
        {mesas.length > 0 && (
          <button className={`venta-tab ${vista === 'mesas' ? 'activo' : ''}`} onClick={() => setVista('mesas')}>
            🪑 Mesas/Cuentas <span className="badge-count">{mesas.length}</span>
          </button>
        )}
        <button className="btn btn-sm btn-gold" style={{ marginLeft: 'auto' }} onClick={() => { setVista('mesas'); }}>
          + Nueva Cuenta
        </button>
      </div>

      {/* VISTA VENTA DIRECTA */}
      {vista === 'venta' && (
        <div className="ventas-layout">
          <div className="panel-busqueda">
            <h2>🔍 Buscar Producto</h2>
            <div className="buscar-row">
              <input
                type="text"
                value={buscador}
                onChange={(e) => setBuscador(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarProducto()}
                placeholder="Escanea código o escribe nombre..."
              />
              <button className="btn btn-gold" onClick={buscarProducto}>Buscar</button>
            </div>

            <div className="lista-productos">
              {listaProductos.length === 0 ? (
                <p className="vacio">Escanea o busca un producto</p>
              ) : (
                listaProductos.map(p => (
                  <div key={p.id} className="producto-item">
                    <div>
                      <strong>{p.nombre}</strong>
                      <p>{p.codigo_barras} • Stock: {p.stock}</p>
                    </div>
                    <span className="precio">${Number(p.precio_venta).toLocaleString('es-CO')}</span>
                    <button className="btn btn-sm btn-gold" onClick={() => agregarAlCarrito(p)}>+ Agregar</button>
                  </div>
                ))
              )}
            </div>

            <h2 style={{ marginTop: '24px' }}>🛒 Carrito</h2>
            {carrito.length === 0 ? (
              <p className="vacio">No hay productos</p>
            ) : (
              <table className="tabla-carrito">
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
                  {carrito.map((item, i) => (
                    <tr key={i}>
                      <td>{item.nombre}</td>
                      <td>${item.precio_unitario.toLocaleString('es-CO')}</td>
                      <td>
                        <input type="number" min="1" value={item.cantidad}
                          onChange={(e) => cambiarCantidad(i, e.target.value)}
                          className="input-cantidad"
                        />
                      </td>
                      <td><strong>${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</strong></td>
                      <td><button className="btn btn-sm btn-rojo" onClick={() => quitarItem(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel-cobro">
            <h2>💳 Cobro</h2>
            <div className="total-box">
              <div className="fila"><span>Productos:</span><span>{items}</span></div>
              <div className="fila grande"><span>TOTAL</span><span>${total.toLocaleString('es-CO')}</span></div>
            </div>

            <div className="campo">
              <label>Cliente (opcional)</label>
              <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}>
                <option value="">Sin cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (Deuda: ${Number(c.saldo_deuda).toLocaleString('es-CO')})</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label>Mesa (opcional)</label>
              <input type="text" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej: Mesa 1, Barra..." />
            </div>

            <p className="label-seccion">MEDIO DE PAGO</p>
            <div className="medios-grid">
              <button className={`medio-btn ${medioSeleccionado === 'efectivo' ? 'seleccionado' : ''}`}
                onClick={() => { setMedioSeleccionado('efectivo'); setBanco(''); }}>💵 Efectivo</button>
              <button className={`medio-btn ${medioSeleccionado === 'transferencia' ? 'seleccionado' : ''}`}
                onClick={() => { setMedioSeleccionado('transferencia'); setDineroRecibido(''); }}>📱 Transferencia</button>
              <button className={`medio-btn ${medioSeleccionado === 'tarjeta' ? 'seleccionado' : ''}`}
                onClick={() => { setMedioSeleccionado('tarjeta'); setBanco(''); setDineroRecibido(''); }}>💳 Tarjeta</button>
            </div>

            {medioSeleccionado === 'transferencia' && (
              <div className="campo" style={{ marginTop: '12px' }}>
                <label>Banco/Plataforma</label>
                <select value={banco} onChange={(e) => setBanco(e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="PSE">PSE</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Davivienda">Davivienda</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}

            {medioSeleccionado === 'efectivo' && (
              <div className="vuelto-box">
                <div className="campo">
                  <label>💵 Dinero recibido</label>
                  <input type="number" value={dineroRecibido} onChange={(e) => setDineroRecibido(e.target.value)} placeholder="¿Cuánto pagó el cliente?" />
                </div>
                {dineroRecibido && (
                  <div className={`vuelto-resultado ${vuelto < 0 ? 'vuelto-negativo' : 'vuelto-positivo'}`}>
                    <span>{vuelto < 0 ? '❌ Falta:' : '✅ Vuelto:'}</span>
                    <strong>${Math.abs(vuelto).toLocaleString('es-CO')}</strong>
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-verde" onClick={registrarVenta} style={{ marginTop: '16px', width: '100%' }}>✅ Registrar Venta</button>
            <button className="btn btn-rojo" onClick={limpiarCarrito} style={{ marginTop: '8px', width: '100%' }}>🗑️ Cancelar</button>

            <h2 style={{ marginTop: '32px' }}>📋 Últimas Ventas</h2>
            <div className="historial">
              {historial.slice(0, 10).map(v => (
                <div key={v.id} className={`venta-item ${v.estado === 'anulada' ? 'venta-anulada' : ''}`}>
                  <div className="venta-fila">
                    <strong>Venta #{v.id}</strong>
                    <strong style={{ color: v.estado === 'anulada' ? '#e74c3c' : '#28a745' }}>
                      ${Number(v.total).toLocaleString('es-CO')}
                    </strong>
                  </div>
                  <div className="venta-fila">
                    <span className="venta-fecha">{new Date(v.fecha).toLocaleString('es-CO')}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: v.estado === 'anulada' ? '#3a0000' : v.estado === 'pendiente' ? '#3a2a00' : '#1a3a1a', color: v.estado === 'anulada' ? '#e74c3c' : v.estado === 'pendiente' ? '#f5a623' : '#2ecc71' }}>
                      {v.estado}
                    </span>
                  </div>
                  {v.estado === 'anulada' && v.motivo_anulacion && (
                    <p style={{ fontSize: '0.78rem', color: '#e74c3c', marginTop: '4px' }}>Motivo: {v.motivo_anulacion}</p>
                  )}
                  {v.estado !== 'anulada' && (
                    <button className="btn-anular" onClick={() => abrirAnulacion(v)}>🚫 Anular</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA MESAS */}
      {vista === 'mesas' && !mesaActual && (
        <div>
          <div className="barra-nueva-mesa" style={{ marginTop: '16px' }}>
            <select value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value)} className="select-tipo">
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
            <p className="vacio" style={{ marginTop: '32px' }}>No hay cuentas abiertas</p>
          ) : (
            <div className="mesas-grid" style={{ marginTop: '16px' }}>
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
      )}

      {/* DETALLE MESA */}
      {vista === 'mesas' && mesaActual && (
        <div style={{ marginTop: '16px' }}>
          <div className="detalle-header">
            <button className="btn btn-sm" onClick={() => setMesaActual(null)}>← Volver</button>
            <h2>🪑 {mesaActual.numero}</h2>
            <div className="detalle-acciones">
              <button className="btn btn-gold" onClick={() => setMostrarModalMesa(true)}>+ Agregar Producto</button>
              <button className="btn btn-verde" onClick={abrirCerrar}>✅ Cerrar Cuenta</button>
            </div>
          </div>

          <div className="mesa-resumen">
            <div className="resumen-dato"><span>Total cuenta</span><strong>${totalMesa.toLocaleString('es-CO')}</strong></div>
            <div className="resumen-dato"><span>Personas</span><strong>{personasEnMesa.length}</strong></div>
            <div className="resumen-dato"><span>Productos</span><strong>{detallesMesa.length}</strong></div>
          </div>

          <div className="personas-tabs">
            {personasEnMesa.map(p => (
              <button key={p} className={`persona-tab ${personaActual === p ? 'activo' : ''}`} onClick={() => setPersonaActual(p)}>
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
                    <tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    {itemsPersona.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.nombre}</strong></td>
                        <td>${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
                        <td>{item.cantidad}</td>
                        <td><strong>${(item.cantidad * Number(item.precio_unitario)).toLocaleString('es-CO')}</strong></td>
                        <td><button className="btn btn-sm btn-rojo" onClick={() => quitarProductoMesa(item.id)}>✕</button></td>
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
        </div>
      )}

      {/* MODAL AGREGAR PRODUCTO A MESA */}
      {mostrarModalMesa && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>+ Agregar Producto</h2>
            <div className="campo">
              <label>Persona</label>
              <input type="text" value={formProducto.persona_nombre}
                onChange={(e) => setFormProducto({ ...formProducto, persona_nombre: e.target.value })}
                placeholder="Nombre de la persona..." list="personas-list" />
              <datalist id="personas-list">
                {personasEnMesa.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="campo">
              <label>Producto</label>
              <select value={formProducto.producto_id} onChange={(e) => setFormProducto({ ...formProducto, producto_id: e.target.value })}>
                <option value="">Selecciona un producto...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio_venta).toLocaleString('es-CO')}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Cantidad</label>
              <input type="number" min="1" value={formProducto.cantidad}
                onChange={(e) => setFormProducto({ ...formProducto, cantidad: e.target.value })} />
            </div>
            <div className="modal-botones">
              <button className="btn btn-rojo" onClick={() => setMostrarModalMesa(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={agregarProductoMesa}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR CUENTA */}
      {mostrarCerrar && (
        <div className="modal-overlay">
          <div className="modal modal-grande">
            <h2>✅ Cerrar Cuenta — {mesaActual?.numero}</h2>
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
                      <select value={pago.medio_pago} onChange={(e) => actualizarPago(persona, idx, 'medio_pago', e.target.value)}>
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">📱 Transferencia</option>
                        <option value="tarjeta">💳 Tarjeta</option>
                      </select>
                      {pago.medio_pago === 'transferencia' && (
                        <select value={pago.banco} onChange={(e) => actualizarPago(persona, idx, 'banco', e.target.value)}>
                          <option value="">Banco...</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Otro">Otro</option>
                        </select>
                      )}
                      <input type="number" value={pago.monto} onChange={(e) => actualizarPago(persona, idx, 'monto', e.target.value)} placeholder="Monto" min="0" />
                      {idx > 0 && <button className="btn btn-sm btn-rojo" onClick={() => quitarPago(persona, idx)}>✕</button>}
                    </div>
                  ))}
                  <button className="btn btn-sm" style={{ marginTop: '8px' }} onClick={() => agregarPago(persona)}>+ Agregar otro medio</button>
                  <div className={`saldo-resumen ${pendiente > 0 ? 'saldo-pendiente' : pendiente < 0 ? 'saldo-sobrante' : 'saldo-ok'}`}>
                    <span>Pagado: ${pagado.toLocaleString('es-CO')}</span>
                    <span>{pendiente > 0 ? `⚠️ Falta: $${pendiente.toLocaleString('es-CO')}` : pendiente < 0 ? `📈 Sobra: $${Math.abs(pendiente).toLocaleString('es-CO')}` : '✅ Saldado'}</span>
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

      {/* RECIBO */}
      {reciboVisible && ultimaVenta && (
        <div className="modal-overlay">
          <div className="modal-recibo">
            <div ref={reciboRef}>
              <h2>🍾 Licores L&P</h2>
              <p style={{ textAlign: 'center', color: '#888' }}>Domicilios: 301 5098967</p>
              <div className="linea-recibo"></div>
              <p><strong>Recibo #{ultimaVenta.id}</strong></p>
              <p>Fecha: {ultimaVenta.fecha}</p>
              {ultimaVenta.cliente && <p>Cliente: {ultimaVenta.cliente}</p>}
              {ultimaVenta.mesa && <p>Mesa: {ultimaVenta.mesa}</p>}
              <div className="linea-recibo"></div>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Producto</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimaVenta.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.nombre}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="linea-recibo"></div>
              <div className="recibo-total">
                <span>TOTAL</span>
                <strong>${ultimaVenta.total.toLocaleString('es-CO')}</strong>
              </div>
              <p>Pago: {ultimaVenta.medio_pago} {ultimaVenta.banco ? `(${ultimaVenta.banco})` : ''}</p>
              {ultimaVenta.medio_pago === 'efectivo' && ultimaVenta.dineroRecibido > 0 && (
                <>
                  <p>Recibido: ${ultimaVenta.dineroRecibido.toLocaleString('es-CO')}</p>
                  <p><strong>Vuelto: ${ultimaVenta.vuelto.toLocaleString('es-CO')}</strong></p>
                </>
              )}
              {ultimaVenta.estado === 'pendiente' && <p style={{ color: 'orange' }}>⚠️ Venta a crédito pendiente</p>}
              <div className="linea-recibo"></div>
              <p style={{ textAlign: 'center' }}>¡Gracias por su compra!</p>
            </div>
            <div className="recibo-botones">
              <button className="btn btn-gold" onClick={imprimirRecibo}>🖨️ Imprimir</button>
              <button className="btn btn-rojo" onClick={() => setReciboVisible(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANULACION */}
      {mostrarAnulacion && ventaAnular && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h2>🚫 Anular Venta #{ventaAnular.id}</h2>
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <p>Total: <strong>${Number(ventaAnular.total).toLocaleString('es-CO')}</strong></p>
              <p>Fecha: {new Date(ventaAnular.fecha).toLocaleString('es-CO')}</p>
            </div>
            <div className="campo">
              <label>Motivo de anulación *</label>
              <input type="text" value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: Error en el cobro, producto devuelto..." autoFocus />
            </div>
            <div className="modal-botones">
              <button className="btn btn-sm" onClick={() => setMostrarAnulacion(false)}>Cancelar</button>
              <button className="btn btn-rojo" onClick={confirmarAnulacion}>🚫 Confirmar Anulación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}