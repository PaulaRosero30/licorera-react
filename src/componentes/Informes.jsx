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
  const [inventario, setInventario] = useState({ productos: [], totales: {} });
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarDatos(); }, [tabActual]);

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
      } else if (tabActual === 'inventario') {
        const res = await informesAPI.inventario();
        setInventario(res.data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const tabs = [
    { id: 'resumen', label: '📊 Resumen' },
    { id: 'vendidos', label: '🏆 Más Vendidos' },
    { id: 'sin-venta', label: '📉 Sin Venta' },
    { id: 'ingresos', label: '💰 Ingresos' },
    { id: 'medios', label: '💳 Por Medio' },
    { id: 'ganancias', label: '💵 Ganancias' },
    { id: 'inventario', label: '📦 Inventario' },
  ];

  return (
    <div className="contenedor">
      <h2>📊 Informes y Reportes</h2>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tabActual === t.id ? 'activo' : ''}`}
            onClick={() => setTabActual(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="cargando">Cargando datos...</div>
      ) : (
        <div className="tab-contenido">

          {/* RESUMEN */}
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

          {/* MÁS VENDIDOS */}
          {tabActual === 'vendidos' && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Total Ingresos</th>
                  <th>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {vendidos.length === 0 ? (
                  <tr><td colSpan="6" className="vacio">Sin datos</td></tr>
                ) : (
                  vendidos.map((v, i) => (
                    <tr key={i}>
                      <td><strong style={{ color: '#f5a623' }}>#{i + 1}</strong></td>
                      <td><strong>{v.nombre}</strong></td>
                      <td>{v.codigo_barras || '—'}</td>
                      <td>{v.cantidad_vendida}</td>
                      <td><strong style={{ color: '#2ecc71' }}>${Number(v.total_vendido).toLocaleString('es-CO')}</strong></td>
                      <td>{v.num_ventas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* SIN VENTA */}
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
                  <tr><td colSpan="5" className="vacio">¡Todos los productos tienen ventas!</td></tr>
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

          {/* INGRESOS DIARIOS */}
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
                  ingresos.map((item, idx) => (
                    <tr key={idx}>
                      <td>{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                      <td>{item.num_ventas}</td>
                      <td><strong style={{ color: '#2ecc71' }}>${Number(item.total_ingresos).toLocaleString('es-CO')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* POR MEDIO DE PAGO */}
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
                      <td><strong style={{ color: '#2ecc71' }}>${Number(m.total).toLocaleString('es-CO')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* GANANCIAS */}
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
                      <td><strong style={{ color: '#2ecc71' }}>${Number(g.ganancia_bruta).toLocaleString('es-CO')}</strong></td>
                      <td>
                        <span className={`badge ${g.margen_porcentaje >= 20 ? 'badge-ok' : 'badge-alerta'}`}>
                          {g.margen_porcentaje}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* INVENTARIO */}
          {tabActual === 'inventario' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <h3>Valor en Costo</h3>
                  <p>${Number(inventario.totales.total_costo || 0).toLocaleString('es-CO')}</p>
                </div>
                <div className="stat-card positivo">
                  <h3>Valor en Venta</h3>
                  <p>${Number(inventario.totales.total_venta || 0).toLocaleString('es-CO')}</p>
                </div>
                <div className="stat-card positivo">
                  <h3>Ganancia Potencial</h3>
                  <p>${Number(inventario.totales.total_ganancia || 0).toLocaleString('es-CO')}</p>
                </div>
              </div>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Precio Costo</th>
                    <th>Precio Venta</th>
                    <th>Valor Costo</th>
                    <th>Valor Venta</th>
                    <th>Ganancia Potencial</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.productos.length === 0 ? (
                    <tr><td colSpan="8" className="vacio">Sin datos</td></tr>
                  ) : (
                    inventario.productos.map((p, i) => (
                      <tr key={i}>
                        <td><strong>{p.nombre}</strong></td>
                        <td>{p.categoria}</td>
                        <td>{p.stock}</td>
                        <td>${Number(p.precio_costo).toLocaleString('es-CO')}</td>
                        <td>${Number(p.precio_venta).toLocaleString('es-CO')}</td>
                        <td>${Number(p.valor_costo).toLocaleString('es-CO')}</td>
                        <td style={{ color: '#2ecc71' }}><strong>${Number(p.valor_venta).toLocaleString('es-CO')}</strong></td>
                        <td style={{ color: '#f5a623' }}><strong>${Number(p.ganancia_potencial).toLocaleString('es-CO')}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}

        </div>
      )}
    </div>
  );
}