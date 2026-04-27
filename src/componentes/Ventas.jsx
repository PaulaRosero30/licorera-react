import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const quitarItem = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setMedioSeleccionado('');
    setBanco('');
    setClienteSeleccionado('');
    setMesa('');
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, i) => acc + (i.precio_unitario * i.cantidad), 0);
  };

  const registrarVenta = async () => {
    if (carrito.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }
    if (!medioSeleccionado) {
      alert('Selecciona un medio de pago');
      return;
    }
    if (medioSeleccionado === 'transferencia' && !banco) {
      alert('Selecciona el banco');
      return;
    }

    try {
      const total = calcularTotal();
      const estado = clienteSeleccionado && medioSeleccionado !== 'efectivo' ? 'pendiente' : 'pagada';
      
      await ventasAPI.crear({
        cliente_id: clienteSeleccionado || null,
        items: carrito,
        medio_pago: medioSeleccionado,
        banco: banco || null,
        mesa: mesa || null,
        estado: estado
      });

      alert(`✅ Venta registrada por $${total.toLocaleString('es-CO')}`);
      limpiarCarrito();
      cargarDatos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const total = calcularTotal();
  const items = carrito.reduce((acc, i) => acc + i.cantidad, 0);

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
                      type="number"
                      min="1"
                      value={item.cantidad}
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
          {clienteSeleccionado && (
            <p className="cliente-info">
              Cliente seleccionado - Venta a crédito
            </p>
          )}
        </div>

        <div className="campo">
          <label>Mesa (opcional)</label>
          <input
            type="text"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            placeholder="Ej: Mesa 1, Barra..."
          />
        </div>

        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>MEDIO DE PAGO</p>
        <div className="medios-grid">
          <button
            className={`medio-btn ${medioSeleccionado === 'efectivo' ? 'seleccionado' : ''}`}
            onClick={() => { setMedioSeleccionado('efectivo'); setBanco(''); }}
          >
            💵 Efectivo
          </button>
          <button
            className={`medio-btn ${medioSeleccionado === 'transferencia' ? 'seleccionado' : ''}`}
            onClick={() => setMedioSeleccionado('transferencia')}
          >
            📱 Transferencia
          </button>
          <button
            className={`medio-btn ${medioSeleccionado === 'tarjeta' ? 'seleccionado' : ''}`}
            onClick={() => { setMedioSeleccionado('tarjeta'); setBanco(''); }}
          >
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
    </div>
  );
}