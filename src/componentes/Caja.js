import React, { useState, useEffect } from 'react';
import { cajaAPI } from '../api/servicios';
import './Caja.css';

export default function Caja({ usuario, modo, cajaInfoInicial, onCajaAbierta, onCajaCerrada, onCerrarSesion }) {
  const [base, setBase] = useState('');
  const [efectivoReal, setEfectivoReal] = useState('');
  const [cajaInfo, setCajaInfo] = useState(cajaInfoInicial || null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const fmt = (val) => Number(val || 0).toLocaleString('es-CO');

  useEffect(() => {
    if (modo === 'cerrar' && !cajaInfo) {
      cargarCaja();
    }
  }, []);

  const cargarCaja = async () => {
    try {
      const res = await cajaAPI.estado(usuario.id);
      if (res.data.abierta) {
        setCajaInfo(res.data.caja);
      }
    } catch {}
  };

  const abrirCaja = async () => {
    if (!base || isNaN(base) || Number(base) < 0) {
      setError('Ingresa un valor válido para la base'); return;
    }
    try {
      setCargando(true);
      setError('');
      await cajaAPI.abrir({ usuario_id: usuario.id, base: Number(base) });
      onCajaAbierta();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al abrir caja');
    } finally {
      setCargando(false);
    }
  };

  const cerrarCaja = async () => {
    if (!efectivoReal || isNaN(efectivoReal) || Number(efectivoReal) < 0) {
      setError('Ingresa el efectivo real en caja'); return;
    }
    try {
      setCargando(true);
      setError('');
      const res = await cajaAPI.cerrar({
        usuario_id: usuario.id,
        efectivo_real: Number(efectivoReal)
      });
      setResultado(res.data.resumen);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cerrar caja');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="caja-overlay">
      <div className="caja-modal">
        <div className="caja-header">
          <h2>Licores L&amp;P</h2>
          <p className="caja-usuario">👤 {usuario.nombre} — {usuario.rol}</p>
        </div>

        {/* MODO ABRIR */}
        {modo === 'abrir' && (
          <div>
            <h3 className="caja-titulo">Apertura de Caja</h3>
            <p className="caja-desc">Ingresa el valor de la base con la que inicias el turno.</p>
            <div className="caja-campo">
              <label>Base inicial ($)</label>
              <input
                type="number"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="Ej: 50000"
                min="0"
                autoFocus
              />
            </div>
            {error && <div className="caja-error">{error}</div>}
            <div className="caja-botones">
              <button className="btn-caja btn-gold" onClick={abrirCaja} disabled={cargando}>
                {cargando ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </div>
        )}

        {/* MODO CERRAR — formulario */}
        {modo === 'cerrar' && !resultado && (
          <div>
            <h3 className="caja-titulo">Cierre de Caja</h3>
            {cajaInfo && (
              <div className="caja-resumen">
                <div className="caja-dato">
                  <span>Base inicial</span>
                  <strong>${fmt(cajaInfo.base)}</strong>
                </div>
                <div className="caja-dato">
                  <span>Ventas en efectivo</span>
                  <strong>${fmt(cajaInfo.ventas_efectivo)}</strong>
                </div>
                <div className="caja-dato destacado">
                  <span>Efectivo esperado</span>
                  <strong>${fmt(cajaInfo.total_efectivo_esperado)}</strong>
                </div>
              </div>
            )}
            <div className="caja-campo">
              <label>Efectivo real en caja ($)</label>
              <input
                type="number"
                value={efectivoReal}
                onChange={(e) => setEfectivoReal(e.target.value)}
                placeholder="¿Cuánto hay en caja?"
                min="0"
                autoFocus
              />
            </div>
            {error && <div className="caja-error">{error}</div>}
            <div className="caja-botones">
              <button className="btn-caja btn-gris" onClick={onCajaCerrada}>Cancelar</button>
              <button className="btn-caja btn-rojo" onClick={cerrarCaja} disabled={cargando}>
                {cargando ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO CIERRE */}
        {modo === 'cerrar' && resultado && (
          <div>
            <h3 className="caja-titulo">Resumen de Cierre</h3>
            <div className="caja-resumen">
              <div className="caja-dato">
                <span>Base inicial</span>
                <strong>${fmt(resultado.base)}</strong>
              </div>
              <div className="caja-dato">
                <span>Ventas en efectivo</span>
                <strong>${fmt(resultado.ventas_efectivo)}</strong>
              </div>
              <div className="caja-dato destacado">
                <span>Efectivo esperado</span>
                <strong>${fmt(resultado.efectivo_esperado)}</strong>
              </div>
              <div className="caja-dato destacado">
                <span>Efectivo real</span>
                <strong>${fmt(resultado.efectivo_real)}</strong>
              </div>
            </div>

            <div className={'caja-descuadre ' + resultado.estado_descuadre}>
              {resultado.estado_descuadre === 'exacto' && (
                <p>Caja cuadrada perfectamente</p>
              )}
              {resultado.estado_descuadre === 'sobrante' && (
                <p>Sobrante: +${fmt(resultado.descuadre)}</p>
              )}
              {resultado.estado_descuadre === 'faltante' && (
                <p>Faltante: -{fmt(Math.abs(Number(resultado.descuadre)))}</p>
              )}
                      </div>
            
                      <div className="caja-botones">
                          <button className="btn-caja btn-gris" onClick={onCerrarSesion}>
                              🚪 Cerrar Sesión
                          </button>
                      </div>
          </div>
        )}
      </div>
    </div>
  );
}