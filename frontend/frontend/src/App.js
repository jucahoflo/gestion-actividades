import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://gestion-backend-tzyt.onrender.com/api';

function App() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(false);
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
  const subareas = ['MECANICA', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'OPERACIONES', 'MANTENIMIENTO'];

  useEffect(() => {
    cargarActividades();
  }, []);

  const cargarActividades = async () => {
    setCargando(true);
    try {
      const response = await axios.get(`${API_URL}/actividades`);
      setActividades(response.data);
      setMensaje(`✅ ${response.data.length} actividades`);
    } catch (error) {
      console.error('Error:', error);
      setMensaje('❌ Error al cargar');
    } finally {
      setCargando(false);
    }
  };

  const agregarActividad = async () => {
    if (!nuevaActividad.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/actividades`, {
        descripcion: nuevaActividad.descripcion,
        tag: nuevaActividad.tag || 'N/A',
        progNoProg: nuevaActividad.progNoProg || 'N/A',
        estacion: nuevaActividad.estacion || 'JAGUAR',
        avance: nuevaActividad.avance || '0%',
        ot: nuevaActividad.ot || 'N/A',
        ejecutante: nuevaActividad.ejecutante || 'N/A',
        subarea: nuevaActividad.subarea,
        fecha: new Date().toLocaleDateString('es-ES'),
        area: 'AREA O SISTEMA'
      });
      if (response.data.success) {
        await cargarActividades();
        setNuevaActividad({ descripcion: '', tag: '', progNoProg: '', estacion: 'JAGUAR', avance: '', ot: '', ejecutante: '', subarea: 'MECANICA' });
        alert('✅ Actividad agregada');
      }
    } catch (error) {
      alert('❌ Error al agregar');
    }
  };

  const eliminarActividad = async (id) => {
    if (window.confirm('¿Eliminar esta actividad?')) {
      try {
        await axios.delete(`${API_URL}/actividades/${id}`);
        await cargarActividades();
        alert('✅ Actividad eliminada');
      } catch (error) {
        alert('❌ Error al eliminar');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px' }}>
        <div style={{ backgroundColor: '#8B0000', borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>GESTIÓN DE ACTIVIDADES POR ÁREA</h1>
        </div>

        <div style={{ padding: '10px', backgroundColor: '#e6f7ff', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
          <span>{mensaje || '📝 Listo'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <input type="text" placeholder="Descripción *" value={nuevaActividad.descripcion} onChange={(e) => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <input type="text" placeholder="TAG" value={nuevaActividad.tag} onChange={(e) => setNuevaActividad({ ...nuevaActividad, tag: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <input type="text" placeholder="PROG/NÓ PROG" value={nuevaActividad.progNoProg} onChange={(e) => setNuevaActividad({ ...nuevaActividad, progNoProg: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <select value={nuevaActividad.estacion} onChange={(e) => setNuevaActividad({ ...nuevaActividad, estacion: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
            {estaciones.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="text" placeholder="AVANCE" value={nuevaActividad.avance} onChange={(e) => setNuevaActividad({ ...nuevaActividad, avance: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <input type="text" placeholder="OT" value={nuevaActividad.ot} onChange={(e) => setNuevaActividad({ ...nuevaActividad, ot: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <input type="text" placeholder="EJECUTANTE" value={nuevaActividad.ejecutante} onChange={(e) => setNuevaActividad({ ...nuevaActividad, ejecutante: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
          <select value={nuevaActividad.subarea} onChange={(e) => setNuevaActividad({ ...nuevaActividad, subarea: e.target.value })} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
            {subareas.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={agregarActividad} style={{ backgroundColor: '#8B0000', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer' }}>+ Agregar Actividad</button>

        <div style={{ marginTop: '20px' }}>
          <h2>📋 Actividades ({actividades.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#8B0000', color: 'white' }}>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>TAG</th>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>ESTACION</th>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>EJECUTANTE</th>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>SUBÁREA</th>
                <th style={{ padding: '8px', border: '1px solid #8B0000' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((act) => (
                <tr key={act.id} style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{act.descripcion}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{act.tag}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{act.estacion}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{act.ejecutante}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{act.subarea}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button onClick={() => eliminarActividad(act.id)} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
