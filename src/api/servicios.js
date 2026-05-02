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
  ingresosPorMedio: () => apiClient.get('/informes/ingresos-por-medio'),
  ganancias: () => apiClient.get('/informes/ganancias'),
  inventario: () => apiClient.get('/informes/inventario'),
  ventasPeriodo: (periodo) => apiClient.get(`/informes/ventas-periodo?periodo=${periodo}`)
};