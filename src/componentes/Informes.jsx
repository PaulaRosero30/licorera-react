import React, { useState, useEffect } from 'react';
import { informesAPI } from '../api/servicios';
import './Informes.css';

export default function Informes({ esAdmin = true }) {
  const [tabActual, setTabActual] = useState('resumen');
  const [resumen, setResumen] = useState(null);
  const [vendidos, setVendidos] = useState([]);
  const [sinVenta, setSinVenta] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [medios, setMedios] = useState({ detalle: [], resumen: { efectivo: 0, transferencia: 0, tarjeta: 0, total: 0 } });
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ganancias, setGanancias] = useState([]);
  const [inventario, setInventario] = useState({ productos: [], totales: {} });
  const [ventasPeriodo, setVentasPeriodo] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('dia');
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  const [fechaCajaDesde, setFechaCajaDesde] = useState('');
  const [fechaCajaHasta, setFechaCajaHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDatos(); }, [tabActual, periodoSeleccionado]);

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
        const res = await informesAPI.ingresosPorMedio(fechaDesde, fechaHasta);
        setMedios(res.data);
      } else if (tabActual === 'ganancias') {
        const res = await informesAPI.ganancias();
        setGanancias(res.data);
      } else if (tabActual === 'inventario') {
        const res = await informesAPI.inventario();
        setInventario(res.data);
      } else if (tabActual === 'periodos') {
        const res = await informesAPI.ventasPeriodo(periodoSeleccionado);
        setVentasPeriodo(res.data);
      } else if (tabActual === 'caja') {
        const res = await informesAPI.movimientosCaja(fechaCajaDesde, fechaCajaHasta);
        setMovimientosCaja(res.data);
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
    { id: 'periodos', label: '📅 Por Período' },
    { id: 'caja', label: '🏪 Caja' },
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
            <>
              <div className="filtro-fecha">
                <div className="campo-fecha">
                  <label>Desde</label>
                  <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>
                <div className="campo-fecha">
                  <label>Hasta</label>
                  <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>
                <button className="btn btn-gold" onClick={cargarDatos}>Filtrar</button>
                <button className="btn btn-sm" onClick={() => { setFechaDesde(''); setFechaHasta(''); }}>Limpiar</button>
              </div>
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <h3>💵 Efectivo</h3>
                  <p>${Number(medios.resumen.efectivo).toLocaleString('es-CO')}</p>
                </div>
                <div className="stat-card">
                  <h3>📱 Transferencia</h3>
                  <p>${Number(medios.resumen.transferencia).toLocaleString('es-CO')}</p>
                </div>
                <div className="stat-card">
                  <h3>💳 Tarjeta</h3>
                  <p>${Number(medios.resumen.tarjeta).toLocaleString('es-CO')}</p>
                </div>
                <div className="stat-card positivo">
                  <h3>Total General</h3>
                  <p>${Number(medios.resumen.total).toLocaleString('es-CO')}</p>
                </div>
              </div>
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
                  {medios.detalle.length === 0 ? (
                    <tr><td colSpan="4" className="vacio">Sin datos</td></tr>
                  ) : (
                    medios.detalle.map((m, i) => (
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
            </>
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
                  <h3>Total Unidades</h3>
                  <p>{Number(inventario.totales.total_unidades || 0).toLocaleString('es-CO')}</p>
                </div>
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

          {/* POR PERÍODO */}
          {tabActual === 'periodos' && (
            <>
              <div className="periodo-selector">
                <button className={`periodo-btn ${periodoSeleccionado === 'dia' ? 'activo' : ''}`} onClick={() => setPeriodoSeleccionado('dia')}>📅 Por Día</button>
                <button className={`periodo-btn ${periodoSeleccionado === 'mes' ? 'activo' : ''}`} onClick={() => setPeriodoSeleccionado('mes')}>📆 Por Mes</button>
                <button className={`periodo-btn ${periodoSeleccionado === 'año' ? 'activo' : ''}`} onClick={() => setPeriodoSeleccionado('año')}>🗓️ Por Año</button>
              </div>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Ventas</th>
                    <th>Ingresos</th>
                    <th>Costo</th>
                    <th>Ganancia Neta</th>
                    <th>Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasPeriodo.length === 0 ? (
                    <tr><td colSpan="6" className="vacio">Sin datos</td></tr>
                  ) : (
                    ventasPeriodo.map((v, i) => {
                      const margen = v.ingresos_totales > 0 ? ((v.ganancia_neta / v.ingresos_totales) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i}>
                          <td><strong>{v.periodo}</strong></td>
                          <td>{v.num_ventas}</td>
                          <td>${Number(v.ingresos_totales).toLocaleString('es-CO')}</td>
                          <td>${Number(v.costo_total).toLocaleString('es-CO')}</td>
                          <td><strong style={{ color: '#2ecc71' }}>${Number(v.ganancia_neta).toLocaleString('es-CO')}</strong></td>
                          <td><span className={`badge ${margen >= 20 ? 'badge-ok' : 'badge-alerta'}`}>{margen}%</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* MOVIMIENTOS DE CAJA */}
          {tabActual === 'caja' && (
            <>
              <div className="filtro-fecha">
                <div className="campo-fecha">
                  <label>Desde</label>
                  <input type="date" value={fechaCajaDesde} onChange={(e) => setFechaCajaDesde(e.target.value)} />
                </div>
                <div className="campo-fecha">
                  <label>Hasta</label>
                  <input type="date" value={fechaCajaHasta} onChange={(e) => setFechaCajaHasta(e.target.value)} />
                </div>
                <button className="btn btn-gold" onClick={cargarDatos}>Filtrar</button>
                <button className="btn btn-sm" onClick={() => { setFechaCajaDesde(''); setFechaCajaHasta(''); }}>Limpiar</button>
              </div>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Cajero</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th>Base</th>
                    <th>Ventas Efectivo</th>
                    <th>Transferencia</th>
                    <th>Tarjeta</th>
                    <th>Esperado</th>
                    <th>Real</th>
                    <th>Descuadre</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosCaja.length === 0 ? (
                    <tr><td colSpan="11" className="vacio">Sin datos</td></tr>
                  ) : (
                    movimientosCaja.map((c, i) => (
                      <tr key={i}>
                        <td><strong>{c.cajero}</strong></td>
                        <td>{new Date(c.abierta_en).toLocaleString('es-CO')}</td>
                        <td>{c.cerrada_en ? new Date(c.cerrada_en).toLocaleString('es-CO') : '—'}</td>
                        <td>${Number(c.base).toLocaleString('es-CO')}</td>
                        <td style={{ color: '#2ecc71' }}>${Number(c.ventas_efectivo).toLocaleString('es-CO')}</td>
                        <td>${Number(c.ventas_transferencia).toLocaleString('es-CO')}</td>
                        <td>${Number(c.ventas_tarjeta).toLocaleString('es-CO')}</td>
                        <td style={{ color: '#f5a623' }}>${Number(c.total_efectivo_esperado || 0).toLocaleString('es-CO')}</td>
                        <td>${Number(c.total_efectivo_real || 0).toLocaleString('es-CO')}</td>
                        <td style={{ color: c.descuadre > 0 ? '#3498db' : c.descuadre < 0 ? '#e74c3c' : '#2ecc71' }}>
                          <strong>{c.descuadre > 0 ? '+' : ''}{Number(c.descuadre || 0).toLocaleString('es-CO')}</strong>
                        </td>
                        <td>
                          <span className={`badge ${c.estado === 'abierta' ? 'badge-ok' : 'badge-alerta'}`}>
                            {c.estado}
                          </span>
                        </td>
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