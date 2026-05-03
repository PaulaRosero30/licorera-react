import apiClient from './config';

// PRODUCTOS
export const productosAPI = {
  obtener: () => apiClient.get('/productos'),
  crear: (data) => apiClient.post('/productos', data),
  actualizar: (id, data) => apiClient.put(`/productos/${id}`, data),
  buscarPorCodigo: (codigo) => apiClient.get(`/productos/barras/${codigo}`)
};

// PROVEEDORES
export const proveedoresAPI = {
  obtener: () => apiClient.get('/proveedores'),
  crear: (data) => apiClient.post('/proveedores', data),
  actualizar: (id, data) => apiClient.put(`/proveedores/${id}`, data),
  eliminar: (id) => apiClient.delete(`/proveedores/${id}`)
};

// VENTAS
export const ventasAPI = {
  obtener: () => apiClient.get('/ventas'),
  crear: (data) => apiClient.post('/ventas', data),
  detalle: (id) => apiClient.get(`/ventas/${id}/detalle`)
};

// CLIENTES
export const clientesAPI = {
  obtener: () => apiClient.get('/clientes'),
  crear: (data) => apiClient.post('/clientes', data),
  actualizar: (id, data) => apiClient.put(`/clientes/${id}`, data),
  detalles: (id) => apiClient.get(`/clientes/${id}/detalles`),
  abono: (id, data) => apiClient.post(`/clientes/${id}/abono`, data)
};

// MESAS
export const mesasAPI = {
  activas: () => apiClient.get('/mesas/activas'),
  crear: (data) => apiClient.post('/mesas', data),
  detalles: (id) => apiClient.get(`/mesas/${id}/detalles`),
  agregar: (id, data) => apiClient.post(`/mesas/${id}/agregar`, data),
  eliminar: (id, detalleId) => apiClient.delete(`/mesas/${id}/eliminar/${detalleId}`),
  cerrar: (id, data) => apiClient.post(`/mesas/${id}/cerrar`, data)
};

// INFORMES
export const informesAPI = {
  resumen: () => apiClient.get('/informes/resumen'),
  productosMasVendidos: () => apiClient.get('/informes/productos-vendidos'),
  productosSinVenta: () => apiClient.get('/informes/productos-sin-venta'),
  ingresos: () => apiClient.get('/informes/ingresos'),
  ingresosPorMedio: (desde, hasta) => apiClient.get(`/informes/ingresos-por-medio${desde && hasta ? `?desde=${desde}&hasta=${hasta}` : ''}`),
  ganancias: () => apiClient.get('/informes/ganancias'),
  inventario: () => apiClient.get('/informes/inventario'),
  ventasPeriodo: (periodo) => apiClient.get(`/informes/ventas-periodo?periodo=${periodo}`),
  movimientosCaja: (desde, hasta) => apiClient.get(`/informes/movimientos-caja${desde && hasta ? `?desde=${desde}&hasta=${hasta}` : ''}`)

};

// CAJA
export const cajaAPI = {
  estado: (usuario_id) => apiClient.get(`/caja/estado/${usuario_id}`),
  abrir: (datos) => apiClient.post('/caja/abrir', datos),
  cerrar: (datos) => apiClient.post('/caja/cerrar', datos),
  historial: (usuario_id) => apiClient.get(`/caja/historial/${usuario_id}`)
};

// USUARIOS
export const usuariosAPI = {
  obtener: () => apiClient.get('/usuarios'),
  crear: (datos) => apiClient.post('/usuarios', datos),
  actualizar: (id, datos) => apiClient.put(`/usuarios/${id}`, datos),
  cambiarEstado: (id, activo) => apiClient.patch(`/usuarios/${id}/estado`, { activo })
};