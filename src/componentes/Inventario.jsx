import React, { useState, useEffect } from 'react';
import { productosAPI } from '../api/servicios';
import './Inventario.css';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [buscador, setBuscador] = useState('');
  const [categoria, setCategoria] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    codigo_barras: '', nombre: '', categoria: 'Aguardiente',
    unidad: '', precio_costo: '', precio_venta: '', stock: '', stock_minimo: ''
  });

  useEffect(() => { cargarProductos(); }, []);
  useEffect(() => { filtrar(); }, [productos, buscador, categoria]);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await productosAPI.obtener();
      setProductos(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar productos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const filtrar = () => {
    let resultado = productos;
    if (buscador) {
      resultado = resultado.filter(p =>
        p.nombre.toLowerCase().includes(buscador.toLowerCase()) ||
        (p.codigo_barras || '').includes(buscador)
      );
    }
    if (categoria) resultado = resultado.filter(p => p.categoria === categoria);
    setFiltrados(resultado);
  };

  const abrirModal = () => {
    setEditandoId(null);
    setForm({ codigo_barras: '', nombre: '', categoria: 'Aguardiente', unidad: '', precio_costo: '', precio_venta: '', stock: '', stock_minimo: '' });
    setMostrarModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) { alert('El nombre es obligatorio'); return; }
    try {
      if (editandoId) {
        await productosAPI.actualizar(editandoId, form);
      } else {
        await productosAPI.crear(form);
      }
      setMostrarModal(false);
      cargarProductos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const editar = (producto) => {
    setEditandoId(producto.id);
    setForm(producto);
    setMostrarModal(true);
  };

  const inactivar = async (producto) => {
    if (!window.confirm(`¿Deseas inactivar "${producto.nombre}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/api/productos/${producto.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarProductos();
    } catch (err) {
      alert('Error al inactivar: ' + err.message);
    }
  };

  const cambiarForm = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const stockBajoList = productos.filter(p => p.stock_bajo);
  const stats = {
    total: productos.length,
    valor: productos.reduce((acc, p) => acc + (p.precio_costo * p.stock), 0),
    stockBajo: stockBajoList.length
  };

  if (cargando) return <div className="contenedor"><p>Cargando...</p></div>;

  return (
    <div className="contenedor">
      <h2>📦 Inventario de Productos</h2>

      {stockBajoList.length > 0 && (
        <div className="alerta-stock">
          <strong>⚠️ Productos con stock bajo:</strong>
          <ul>
            {stockBajoList.map(p => (
              <li key={p.id}>{p.nombre} — Stock actual: <strong>{p.stock}</strong> (mínimo: {p.stock_minimo})</li>
            ))}
          </ul>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Valor Inventario</h3>
          <p>${stats.valor.toLocaleString('es-CO')}</p>
        </div>
        <div className="stat-card alerta">
          <h3>⚠️ Stock Bajo</h3>
          <p>{stats.stockBajo}</p>
        </div>
      </div>

      <div className="barra-busqueda">
        <input type="text" placeholder="🔍 Buscar producto..." value={buscador} onChange={(e) => setBuscador(e.target.value)} />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          <option value="Aguardiente">Aguardiente</option>
          <option value="Ron">Ron</option>
          <option value="Cerveza">Cerveza</option>
          <option value="Vino">Vino</option>
          <option value="Vodka">Vodka</option>
          <option value="Whisky">Whisky</option>
          <option value="Otro">Otro</option>
        </select>
        <button className="btn btn-gold" onClick={abrirModal}>+ Agregar</button>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio Costo</th>
            <th>Precio Venta</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr><td colSpan="8" className="vacio">No hay productos</td></tr>
          ) : (
            filtrados.map(p => (
              <tr key={p.id} className={p.stock_bajo ? 'fila-bajo' : ''}>
                <td>{p.codigo_barras || '—'}</td>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.categoria}</td>
                <td>${Number(p.precio_costo).toLocaleString('es-CO')}</td>
                <td>${Number(p.precio_venta).toLocaleString('es-CO')}</td>
                <td><strong>{p.stock}</strong></td>
                <td>
                  <span className={`badge ${p.stock_bajo ? 'badge-bajo' : 'badge-ok'}`}>
                    {p.stock_bajo ? '⚠️ Bajo' : '✅ OK'}
                  </span>
                </td>
                <td className="acciones">
                  <button className="btn btn-sm" onClick={() => editar(p)}>Editar</button>
                  <button className="btn btn-sm btn-rojo" onClick={() => inactivar(p)}>Inactivar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editandoId ? 'Editar Producto' : 'Agregar Producto'}</h2>
            <div className="campo">
              <label>Nombre *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={cambiarForm} />
            </div>
            <div className="campo">
              <label>Código de Barras</label>
              <input type="text" name="codigo_barras" value={form.codigo_barras} onChange={cambiarForm} />
            </div>
            <div className="campo">
              <label>Categoría</label>
              <select name="categoria" value={form.categoria} onChange={cambiarForm}>
                <option value="Aguardiente">Aguardiente</option>
                <option value="Ron">Ron</option>
                <option value="Cerveza">Cerveza</option>
                <option value="Vino">Vino</option>
                <option value="Vodka">Vodka</option>
                <option value="Whisky">Whisky</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="campo">
              <label>Unidad</label>
              <input type="text" name="unidad" value={form.unidad} onChange={cambiarForm} placeholder="Botella, Sixpack..." />
            </div>
            <div className="fila-campos">
              <div className="campo">
                <label>Precio Costo ($)</label>
                <input type="number" name="precio_costo" value={form.precio_costo} onChange={cambiarForm} />
              </div>
              <div className="campo">
                <label>Precio Venta ($)</label>
                <input type="number" name="precio_venta" value={form.precio_venta} onChange={cambiarForm} />
              </div>
            </div>
            <div className="fila-campos">
              <div className="campo">
                <label>Stock Actual</label>
                <input type="number" name="stock" value={form.stock} onChange={cambiarForm} />
              </div>
              <div className="campo">
                <label>Stock Mínimo</label>
                <input type="number" name="stock_minimo" value={form.stock_minimo} onChange={cambiarForm} />
              </div>
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