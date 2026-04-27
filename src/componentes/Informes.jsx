import React, { useState, useEffect } from 'react';
import { informesAPI } from '../api/servicios';
import './Informes.css';

export default function Informes() {
  const [tabActual, setTabActual] = useState('resumen');
  const [resumen, setResumen] = useState(null);
  const [vendidos, setVendidos] = useState([]);
  const [sinVenta, setSinVenta] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [medios, setMedios] = useState([]);
  const [ganancias, setGanancias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [tabActual]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (tabActual === 'resumen') {
        const res = await informesAPI.resumen();
        setResumen(res.data);
      } else if (tabActual === 'vendidos') {
        const res = await informesAPI.productosMasVendidos();
        setVendidos(res.data);
      } else if (tabActual === 'sin-venta') {
        const res = await informesAPI.productosSinVenta();
        setSinVenta(res.data);
      } else if (tabActual === 'ingresos') {
        const res = await informesAPI.ingresos();
        setIngresos(res.data);
      } else if (tabActual === 'medios') {
        const res = await informesAPI.ingresosPorMedio();
        setMedios(res.data);
      } else if (tabActual === 'ganancias') {
        const res = await informesAPI.ganancias();
        setGanancias(res.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor">
      <h2>📊 Informes y Reportes</h2>

      <div className="tabs">
        <button
          className={`tab-btn ${tabActual === 'resumen' ? 'activo' : ''}`}
          onClick={() => setTabActual('resumen')}
        >
          📊 Resumen
        </button>
        <button
          className={`tab-btn ${tabActual === 'vendidos' ? 'activo' : ''}`}
          onClick={() => setTabActual('vendidos')}
        >
          🏆 Más Vendidos
        </button>
        <button
          className={`tab-btn ${tabActual === 'sin-venta' ? 'activo' : ''}`}
          onClick={() => setTabActual('sin-venta')}
        >
          📉 Sin Venta
        </button>
        <button
          className={`tab-btn ${tabActual === 'ingresos' ? 'activo' : ''}`}
          onClick={() => setTabActual('ingresos')}
        >
          💰 Ingresos
        </button>
        <button
          className={`tab-btn ${tabActual === 'medios' ? 'activo' : ''}`}
          onClick={() => setTabActual('medios')}
        >
          💳 Por Medio
        </button>
        <button
          className={`tab-btn ${tabActual === 'ganancias' ? 'activo' : ''}`}
          onClick={() => setTabActual('ganancias')}
        >
          💵 Ganancias
        </button>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <>
          {tabActual === 'resumen' && resumen && (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Ventas</h3>
                <p>{resumen.ventas.total_ventas}</p>
              </div>
              <div className="stat-card positivo">
                <h3>Ingresos Totales</h3>
                <p>${Number(resumen.ganancias.ingresos_totales).toLocaleString('es-CO')}</p>
              </div>
              <div className="stat-card">
                <h3>Productos</h3>
                <p>{resumen.productos.total_productos}</p>
                <span>Valor: ${Number(resumen.productos.valor_inventario).toLocaleString('es-CO')}</span>
              </div>
              <div className="stat-card">
                <h3>Clientes</h3>
                <p>{resumen.clientes.total_clientes}</p>
                <span>Deuda: ${Number(resumen.clientes.total_deuda).toLocaleString('es-CO')}</span>
              </div>
              <div className="stat-card">
                <h3>Costo Total</h3>
                <p>${Number(resumen.ganancias.costo_total).toLocaleString('es-CO')}</p>
              </div>
              <div className="stat-card positivo">
                <h3>Ganancia Bruta</h3>
                <p>${Number(resumen.ganancias.ganancia_bruta).toLocaleString('es-CO')}</p>
                <span>Margen: {resumen.ganancias.margen_porcentaje}%</span>
              </div>
            </div>
          )}

          {tabActual === 'vendidos' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Total Ingresos</th>
                  <th>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {vendidos.length === 0 ? (
                  <tr><td colSpan="5" className="vacio">Sin datos</td></tr>
                ) : (
                  vendidos.map((v, i) => (
                    <tr key={i}>
                      <td><strong>{v.nombre}</strong></td>
                      <td>{v.codigo_barras || '—'}</td>
                      <td>{v.cantidad_vendida}</td>
                      <td><strong>${Number(v.total_vendido).toLocaleString('es-CO')}</strong></td>
                      <td>{v.num_ventas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tabActual === 'sin-venta' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio Costo</th>
                  <th>Precio Venta</th>
                </tr>
              </thead>
              <tbody>
                {sinVenta.length === 0 ? (
                  <tr><td colSpan="5" className="vacio">¡Todos tienen ventas!</td></tr>
                ) : (
                  sinVenta.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.nombre}</strong></td>
                      <td>{p.categoria}</td>
                      <td>{p.stock}</td>
                      <td>${Number(p.precio_costo).toLocaleString('es-CO')}</td>
                      <td>${Number(p.precio_venta).toLocaleString('es-CO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tabActual === 'ingresos' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.length === 0 ? (
                  <tr><td colSpan="3" className="vacio">Sin datos</td></tr>
                ) : (
                  ingresos.map((i, idx) => (
                    <tr key={idx}>
                      <td>{new Date(i.fecha).toLocaleDateString('es-CO')}</td>
                      <td>{i.num_ventas}</td>
                      <td><strong>${Number(i.total_ingresos).toLocaleString('es-CO')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tabActual === 'medios' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Medio Pago</th>
                  <th>Banco</th>
                  <th>Ventas</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {medios.length === 0 ? (
                  <tr><td colSpan="4" className="vacio">Sin datos</td></tr>
                ) : (
                  medios.map((m, i) => (
                    <tr key={i}>
                      <td><strong>{m.medio_pago}</strong></td>
                      <td>{m.banco || '—'}</td>
                      <td>{m.num_ventas}</td>
                      <td><strong>${Number(m.total).toLocaleString('es-CO')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tabActual === 'ganancias' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Costo</th>
                  <th>Precio Venta</th>
                  <th>Ganancia</th>
                  <th>Margen %</th>
                </tr>
              </thead>
              <tbody>
                {ganancias.length === 0 ? (
                  <tr><td colSpan="6" className="vacio">Sin datos</td></tr>
                ) : (
                  ganancias.map((g, i) => (
                    <tr key={i}>
                      <td><strong>{g.nombre}</strong></td>
                      <td>{g.cantidad}</td>
                      <td>${Number(g.precio_costo_prom).toLocaleString('es-CO')}</td>
                      <td>${Number(g.precio_venta_prom).toLocaleString('es-CO')}</td>
                      <td><strong style={{ color: '#28a745' }}>${Number(g.ganancia_bruta).toLocaleString('es-CO')}</strong></td>
                      <td><strong>{g.margen_porcentaje}%</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}