import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://gestion-backend-tzyt.onrender.com/api';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [token, setToken] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const [fecha, setFecha] = useState(new Date().toLocaleDateString('es-ES'));
  const [area, setArea] = useState('jaguar lineas diesel');
  const [actividades, setActividades] = useState([]);
  const [exportando, setExportando] = useState(false);
  const [fechaExportar, setFechaExportar] = useState(new Date().toLocaleDateString('es-ES'));
  const [mensaje, setMensaje] = useState('');
  
  const [nuevaActividad, setNuevaActividad] = useState({
    descripcion: '',
    tag: '',
    progNoProg: '',
    estacion: 'JAGUAR',
    avance: '',
    ot: '',
    ejecutante: '',
    subarea: 'MECANICA'
  });

  const estaciones = ['JAGUAR', 'CARACARA', 'T SENTADO', 'MANI', 'OTRO'];

  const subareas = [
    'MECANICA', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'OPERACIONES',
    'MANTENIMIENTO', 'VALVULAS PSV Y PVV', 'A&C', 'CBM',
    'VSD', 'FACILIDADES', 'OBREROS DE PATIO', 'CAMPAMENTERO', 'HSEQ'
  ];

  const getSubareaColor = (subarea) => {
    const colores = {
      'MECANICA': { bg: '#e6f7ff', text: '#1890ff' },
      'ELÉCTRICO': { bg: '#fff7e6', text: '#fa8c16' },
      'INSTRUMENTACIÓN': { bg: '#f6ffed', text: '#52c41a' },
      'OPERACIONES': { bg: '#f9f0ff', text: '#722ed1' },
      'MANTENIMIENTO': { bg: '#f5f5f5', text: '#595959' },
      'VALVULAS PSV Y PVV': { bg: '#fce4ec', text: '#c62828' },
      'A&C': { bg: '#e8f5e9', text: '#2e7d32' },
      'CBM': { bg: '#e3f2fd', text: '#0d47a1' },
      'VSD': { bg: '#fff3e0', text: '#e65100' },
      'FACILIDADES': { bg: '#f3e5f5', text: '#6a1b9a' },
      'OBREROS DE PATIO': { bg: '#fff8e1', text: '#f57f17' },
      'CAMPAMENTERO': { bg: '#e0f7fa', text: '#00695c' },
      'HSEQ': { bg: '#fbe9e7', text: '#bf360c' }
    };
    return colores[subarea] || { bg: '#f5f5f5', text: '#595959' };
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      verificarToken(savedToken);
    }
  }, []);

  useEffect(() => {
    cargarActividades();
  }, []);

  const verificarToken = async (tokenGuardado) => {
    try {
      const response = await axios.post(`${API_URL}/verify`, { token: tokenGuardado });
      if (response.data.valid && response.data.role === 'admin') {
        setToken(tokenGuardado);
        setIsAdmin(true);
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('adminToken');
    }
  };

  const cargarActividades = async () => {
    try {
      console.log('📡 Cargando actividades...');
      const response = await axios.get(`${API_URL}/actividades`);
      console.log('✅ Actividades cargadas:', response.data);
      setActividades(response.data);
      setMensaje(`✅ ${response.data.length} actividades`);
    } catch (error) {
      console.error('❌ Error:', error);
      setMensaje('❌ Error al cargar');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        usuario,
        contrasena
      });

      if (response.data.success) {
        setToken(response.data.token);
        setIsAdmin(true);
        localStorage.setItem('adminToken', response.data.token);
        setUsuario('');
        setContrasena('');
        setMostrarLogin(false);
        alert('✅ Modo Administrador activado');
        await cargarActividades();
      }
    } catch (error) {
      console.error('Error en login:', error);
      setErrorLogin('❌ Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setToken('');
    localStorage.removeItem('adminToken');
    alert('🔒 Modo Administrador desactivado');
  };

  const agregarActividad = async () => {
    if (!nuevaActividad.descripcion.trim()) {
      alert('⚠️ La descripción es obligatoria');
      return;
    }
    
    try {
      const data = {
        descripcion: nuevaActividad.descripcion,
        tag: nuevaActividad.tag || 'N/A',
        progNoProg: nuevaActividad.progNoProg || 'N/A',
        estacion: nuevaActividad.estacion || 'JAGUAR',
        avance: nuevaActividad.avance || '0%',
        ot: nuevaActividad.ot || 'N/A',
        ejecutante: nuevaActividad.ejecutante || 'N/A',
        subarea: nuevaActividad.subarea,
        fecha: fecha,
        area: area
      };
      
      console.log('📤 Enviando actividad:', data);
      const response = await axios.post(`${API_URL}/actividades`, data);

      if (response.data.success) {
        console.log('✅ Actividad guardada:', response.data);
        alert('✅ Actividad agregada correctamente');
        await cargarActividades();
        setNuevaActividad({
          descripcion: '',
          tag: '',
          progNoProg: '',
          estacion: 'JAGUAR',
          avance: '',
          ot: '',
          ejecutante: '',
          subarea: 'MECANICA'
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al agregar la actividad');
    }
  };

  const eliminarActividad = async (id) => {
    if (window.confirm('¿Eliminar esta actividad?')) {
      try {
        await axios.delete(`${API_URL}/actividades/${id}`);
        await cargarActividades();
        alert('✅ Actividad eliminada');
      } catch (error) {
        console.error('Error eliminando actividad:', error);
        alert('❌ Error al eliminar la actividad');
      }
    }
  };

  const limpiarTodo = async () => {
    if (window.confirm('¿Eliminar todas las actividades?')) {
      try {
        await axios.delete(`${API_URL}/actividades`);
        await cargarActividades();
        alert('✅ Todas las actividades eliminadas');
      } catch (error) {
        console.error('Error eliminando actividades:', error);
        alert('❌ Error al eliminar las actividades');
      }
    }
  };

  const exportarExcel = async () => {
    if (!isAdmin) {
      alert('⚠️ Debes iniciar sesión como administrador');
      return;
    }

    if (actividades.length === 0) {
      alert('⚠️ No hay actividades para exportar');
      return;
    }

    setExportando(true);
    try {
      const response = await axios.post(`${API_URL}/export-excel`, {
        fecha: fechaExportar,
        area: area,
        token: token
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gestion_actividades_${fechaExportar.replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('✅ Excel exportado correctamente');
    } catch (error) {
      console.error('❌ Error exportando:', error);
      alert('❌ Error al exportar el Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      agregarActividad();
    }
  };

  const LoginModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '40px', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        width: '100%', maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            backgroundColor: '#8B0000', width: '80px', height: '80px',
            borderRadius: '50%', display: 'flex', justifyContent: 'center',
            alignItems: 'center', margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: '36px' }}>🔐</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Acceso Administrador</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
            Ingresa tus credenciales para exportar
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #e0e0e0', borderRadius: '6px',
                fontSize: '14px'
              }}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #e0e0e0', borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          {errorLogin && (
            <div style={{
              backgroundColor: '#ffebee', color: '#c62828',
              padding: '10px', borderRadius: '6px',
              marginBottom: '16px', fontSize: '14px', textAlign: 'center'
            }}>
              {errorLogin}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: '#8B0000', color: 'white',
              border: 'none', borderRadius: '6px',
              fontSize: '16px', fontWeight: 'bold',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? '⏳ Verificando...' : '🚀 Iniciar Sesión'}
          </button>

          <button
            type="button"
            onClick={() => setMostrarLogin(false)}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: '#f5f5f5', color: '#666',
              border: 'none', borderRadius: '6px',
              fontSize: '14px', cursor: 'pointer', marginTop: '8px'
            }}
          >
            ❌ Cancelar
          </button>

          <div style={{
            marginTop: '16px', padding: '12px',
            backgroundColor: '#f5f5f5', borderRadius: '6px',
            fontSize: '12px', color: '#666', textAlign: 'center'
          }}>
            💡 <strong>Credenciales:</strong> Usuario: Gestion | Contraseña: 2026
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {mostrarLogin && <LoginModal />}

      <div style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ backgroundColor: '#8B0000', borderRadius: '8px', padding: '16px 24px', flex: 1, minWidth: '250px' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              GESTIÓN DE ACTIVIDADES POR ÁREA
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#52c41a', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
              ☁️ Cloud
            </span>
            {isAdmin ? (
              <>
                <span style={{ backgroundColor: '#52c41a', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                  👑 Administrador
                </span>
                <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                  🚪 Cerrar
                </button>
              </>
            ) : (
              <button onClick={() => setMostrarLogin(true)} style={{ backgroundColor: '#1890ff', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                🔑 Administrador
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '10px 16px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '14px' }}>{mensaje || '📝 Listo para agregar actividades'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>FECHA</label>
            <input type="text" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>AREA</label>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ backgroundColor: '#fafafa', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', marginTop: 0, marginBottom: '12px' }}>➕ Agregar Actividad</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            <input type="text" placeholder="Descripción *" value={nuevaActividad.descripcion} onChange={(e) => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <input type="text" placeholder="TAG" value={nuevaActividad.tag} onChange={(e) => setNuevaActividad({ ...nuevaActividad, tag: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <input type="text" placeholder="PROG/NÓ PROG" value={nuevaActividad.progNoProg} onChange={(e) => setNuevaActividad({ ...nuevaActividad, progNoProg: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <select value={nuevaActividad.estacion} onChange={(e) => setNuevaActividad({ ...nuevaActividad, estacion: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' }}>
              {estaciones.map(est => <option key={est} value={est}>{est}</option>)}
            </select>
            <input type="text" placeholder="AVANCE" value={nuevaActividad.avance} onChange={(e) => setNuevaActividad({ ...nuevaActividad, avance: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <input type="text" placeholder="OT" value={nuevaActividad.ot} onChange={(e) => setNuevaActividad({ ...nuevaActividad, ot: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <input type="text" placeholder="EJECUTANTE" value={nuevaActividad.ejecutante} onChange={(e) => setNuevaActividad({ ...nuevaActividad, ejecutante: e.target.value })} onKeyPress={handleKeyPress} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
            <select value={nuevaActividad.subarea} onChange={(e) => setNuevaActividad({ ...nuevaActividad, subarea: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' }}>
              {subareas.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <button onClick={agregarActividad} style={{ marginTop: '12px', backgroundColor: '#8B0000', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            + Agregar Actividad
          </button>
          <span style={{ marginLeft: '12px', fontSize: '12px', color: '#999' }}>Presiona Enter para agregar</span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>📋 Actividades Registradas ({actividades.length})</h2>
            {actividades.length > 0 && (
              <button onClick={limpiarTodo} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                Limpiar Todo
              </button>
            )}
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#8B0000', color: 'white' }}>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>TAG</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>PROG/NÓ PROG</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>ESTACION</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>AVANCE</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>OT</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>EJECUTANTE</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>SUBÁREA</th>
                  <th style={{ padding: '10px', border: '1px solid #8B0000', textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((act, index) => {
                  const color = getSubareaColor(act.subarea);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #e8e8e8' }}>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.descripcion}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.tag}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.prog_no_prog || act.progNoProg}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                          {act.estacion}
                        </span>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.avance}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.ot}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>{act.ejecutante}</td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>
                        <span style={{ backgroundColor: color.bg, color: color.text, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                          {act.subarea}
                        </span>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e8e8e8', textAlign: 'center' }}>
                        <button onClick={() => eliminarActividad(act.id)} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {actividades.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                      📭 No hay actividades registradas. Agrega una nueva actividad.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAdmin && (
          <div style={{ backgroundColor: '#f6ffed', border: '2px solid #b7eb8f', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>📅 Fecha para exportar</label>
                <input type="text" value={fechaExportar} onChange={(e) => setFechaExportar(e.target.value)} placeholder="DD/MM/YYYY" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <button onClick={exportarExcel} disabled={exportando || actividades.length === 0} style={{ backgroundColor: exportando || actividades.length === 0 ? '#d9d9d9' : '#52c41a', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '4px', cursor: exportando || actividades.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  {exportando ? '⏳ Exportando...' : '📊 Exportar a Excel'}
                </button>
                <button onClick={() => setFechaExportar(new Date().toLocaleDateString('es-ES'))} style={{ backgroundColor: '#1890ff', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  Hoy
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '4px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          💡 <strong>Consejo:</strong> Los datos se guardan en Supabase PostgreSQL en la nube.
          {!isAdmin && ' 🔑 Presiona "Administrador" para exportar a Excel.'}
        </div>
      </div>
    </div>
  );
}

export default App;
// Forzando rebuild
