import React, { useState, useEffect, useRef } from 'react';
import { productosAPI, ventasAPI, clientesAPI } from '../api/servicios';
import './Ventas.css';

export default function Ventas() {
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
  const reciboRef = useRef();

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [prodRes, clientRes, ventasRes] = await Promise.all([
        productosAPI.obtener(),
        clientesAPI.obtener(),
        ventasAPI.obtener()
      ]);
      setProductos(prodRes.data);
      setClientes(clientRes.data);
      setHistorial(ventasRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

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

  const calcularVuelto = () => {
    const recibido = parseFloat(dineroRecibido) || 0;
    const total = calcularTotal();
    return recibido - total;
  };

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

  const imprimirRecibo = () => {
    const contenido = reciboRef.current.innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    ventana.document.write(`
      <html>
        <head>
          <title>Recibo Licores L&P</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 20px; color: #000; }
            h2 { text-align: center; margin-bottom: 4px; }
            p { margin: 2px 0; }
            .linea { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 4px; }
            .derecha { text-align: right; }
            .total { font-weight: bold; font-size: 15px; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const total = calcularTotal();
  const items = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const vuelto = calcularVuelto();

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
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
                    <input
                      type="number" min="1" value={item.cantidad}
                      onChange={(e) => cambiarCantidad(i, e.target.value)}
                      className="input-cantidad"
                    />
                  </td>
                  <td><strong>${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</strong></td>
                  <td>
                    <button className="btn btn-sm btn-rojo" onClick={() => quitarItem(i)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel-cobro">
        <h2>💳 Cobro</h2>

        <div className="total-box">
          <div className="fila">
            <span>Productos:</span>
            <span>{items}</span>
          </div>
          <div className="fila grande">
            <span>TOTAL</span>
            <span>${total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="campo">
          <label>Cliente (opcional)</label>
          <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}>
            <option value="">Sin cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} (Deuda: ${Number(c.saldo_deuda).toLocaleString('es-CO')})
              </option>
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
            onClick={() => { setMedioSeleccionado('efectivo'); setBanco(''); }}>
            💵 Efectivo
          </button>
          <button className={`medio-btn ${medioSeleccionado === 'transferencia' ? 'seleccionado' : ''}`}
            onClick={() => { setMedioSeleccionado('transferencia'); setDineroRecibido(''); }}>
            📱 Transferencia
          </button>
          <button className={`medio-btn ${medioSeleccionado === 'tarjeta' ? 'seleccionado' : ''}`}
            onClick={() => { setMedioSeleccionado('tarjeta'); setBanco(''); setDineroRecibido(''); }}>
            💳 Tarjeta
          </button>
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
              <input
                type="number"
                value={dineroRecibido}
                onChange={(e) => setDineroRecibido(e.target.value)}
                placeholder="¿Cuánto pagó el cliente?"
              />
            </div>
            {dineroRecibido && (
              <div className={`vuelto-resultado ${vuelto < 0 ? 'vuelto-negativo' : 'vuelto-positivo'}`}>
                <span>{vuelto < 0 ? '❌ Falta:' : '✅ Vuelto:'}</span>
                <strong>${Math.abs(vuelto).toLocaleString('es-CO')}</strong>
              </div>
            )}
          </div>
        )}

        <button className="btn btn-verde" onClick={registrarVenta} style={{ marginTop: '16px', width: '100%' }}>
          ✅ Registrar Venta
        </button>
        <button className="btn btn-rojo" onClick={limpiarCarrito} style={{ marginTop: '8px', width: '100%' }}>
          🗑️ Cancelar
        </button>

        <h2 style={{ marginTop: '32px' }}>📋 Últimas Ventas</h2>
        <div className="historial">
          {historial.slice(0, 10).map(v => (
            <div key={v.id} className="venta-item">
              <div className="venta-fila">
                <strong>Venta #{v.id}</strong>
                <strong style={{ color: '#28a745' }}>${Number(v.total).toLocaleString('es-CO')}</strong>
              </div>
              <p className="venta-fecha">{new Date(v.fecha).toLocaleString('es-CO')}</p>
            </div>
          ))}
        </div>
      </div>

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
              {ultimaVenta.estado === 'pendiente' && (
                <p style={{ color: 'orange' }}>⚠️ Venta a crédito pendiente</p>
              )}
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
    </div>
  );
}