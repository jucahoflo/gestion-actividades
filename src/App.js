import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [fecha, setFecha] = useState('1/09/2026');
  const [area, setArea] = useState('AREA O SISTEMA');
  const [actividades, setActividades] = useState([]);
  const [exportando, setExportando] = useState(false);
  const [filtro, setFiltro] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  
  const [nuevaActividad, setNuevaActividad] = useState({
    descripcion: '',
    tag: '',
    progNoProg: '',
    estacion: 'P',
    avance: '',
    ot: '',
    ejecutante: '',
    subarea: 'MECANICA'
  });

  const subareas = ['TODOS', 'MECANICA', 'ELÉCTRICO', 'INSTRUMENTACIÓN', 'OPERACIONES', 'MANTENIMIENTO'];

  // Cargar datos guardados
  useEffect(() => {
    const savedData = localStorage.getItem('actividadesData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setActividades(parsed.actividades || []);
        setFecha(parsed.fecha || '1/09/2026');
        setArea(parsed.area || 'AREA O SISTEMA');
      } catch (e) {
        console.error('Error cargando datos guardados:', e);
      }
    }
  }, []);

  // Guardar datos automáticamente
  useEffect(() => {
    localStorage.setItem('actividadesData', JSON.stringify({
      fecha,
      area,
      actividades
    }));
  }, [fecha, area, actividades]);

  // Filtrar actividades
  const actividadesFiltradas = actividades.filter(act => {
    const matchFiltro = filtro === 'TODOS' || act.subarea === filtro;
    const matchBusqueda = act.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
                          act.ejecutante.toLowerCase().includes(busqueda.toLowerCase()) ||
                          act.tag.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const agregarActividad = () => {
    if (!nuevaActividad.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }
    setActividades([...actividades, { ...nuevaActividad }]);
    setNuevaActividad({
      descripcion: '',
      tag: '',
      progNoProg: '',
      estacion: 'P',
      avance: '',
      ot: '',
      ejecutante: '',
      subarea: 'MECANICA'
    });
  };

  const eliminarActividad = (index) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      const nuevas = actividades.filter((_, i) => i !== index);
      setActividades(nuevas);
    }
  };

  const limpiarTodo = () => {
    if (window.confirm('¿Estás seguro de limpiar todas las actividades?')) {
      setActividades([]);
    }
  };

  const exportarExcel = async () => {
    if (actividades.length === 0) {
      alert('No hay actividades para exportar');
      return;
    }

    setExportando(true);
    try {
      const response = await axios.post(`${API_URL}/export-excel`, {
        fecha,
        area,
        actividades
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gestion_actividades_${fecha.replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Mostrar notificación de éxito
      mostrarNotificacion('✅ Excel exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando:', error);
      mostrarNotificacion('❌ Error al exportar el Excel', 'error');
    } finally {
      setExportando(false);
    }
  };

  // Notificación personalizada
  const mostrarNotificacion = (mensaje, tipo) => {
    const notificacion = document.createElement('div');
    notificacion.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all transform translate-x-0 ${
      tipo === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    setTimeout(() => {
      notificacion.style.transform = 'translateX(400px)';
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      agregarActividad();
    }
  };

  // Obtener color de subárea
  const getSubareaColor = (subarea) => {
    const colores = {
      'MECANICA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ELÉCTRICO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'INSTRUMENTACIÓN': 'bg-green-100 text-green-800 border-green-200',
      'OPERACIONES': 'bg-purple-100 text-purple-800 border-purple-200',
      'MANTENIMIENTO': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colores[subarea] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con efecto de sombra */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl p-6 mb-6 shadow-2xl transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider">
                  GESTIÓN DE ACTIVIDADES POR ÁREA
                </h1>
                <p className="text-red-200 text-sm mt-1">Sistema de control y seguimiento</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs">
                {actividades.length} actividades
              </span>
            </div>
          </div>
        </div>

        {/* Panel de control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              FECHA
            </label>
            <input
              type="text"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              AREA
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Formulario de nueva actividad - Diseño mejorado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="bg-red-100 text-red-700 p-1.5 rounded-lg mr-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </span>
              Agregar Actividad
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Presiona Enter para agregar
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Descripción *"
              value={nuevaActividad.descripcion}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="TAG"
              value={nuevaActividad.tag}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, tag: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="PROG/NÓ PROG"
              value={nuevaActividad.progNoProg}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, progNoProg: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="ESTACION"
              value={nuevaActividad.estacion}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, estacion: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="AVANCE"
              value={nuevaActividad.avance}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, avance: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="OT"
              value={nuevaActividad.ot}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, ot: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <input
              type="text"
              placeholder="EJECUTANTE"
              value={nuevaActividad.ejecutante}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, ejecutante: e.target.value })}
              onKeyPress={handleKeyPress}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300"
            />
            <select
              value={nuevaActividad.subarea}
              onChange={(e) => setNuevaActividad({ ...nuevaActividad, subarea: e.target.value })}
              className="border-2 border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-300 bg-white"
            >
              {subareas.filter(s => s !== 'TODOS').map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={agregarActividad}
            className="mt-4 bg-gradient-to-r from-red-700 to-red-600 text-white px-6 py-2.5 rounded-lg hover:from-red-800 hover:to-red-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Agregar Actividad</span>
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {subareas.map(sub => (
                <button
                  key={sub}
                  onClick={() => setFiltro(sub)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filtro === sub
                      ? 'bg-red-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sub}
                  {sub !== 'TODOS' && (
                    <span className={`ml-1 text-xs ${
                      filtro === sub ? 'text-red-200' : 'text-gray-400'
                    }`}>
                      ({actividades.filter(a => a.subarea === sub).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Tabla de actividades */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              📋 Actividades Registradas
              <span className="ml-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {actividadesFiltradas.length}
              </span>
            </h2>
            {actividades.length > 0 && (
              <button
                onClick={limpiarTodo}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span>Limpiar Todo</span>
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-900 to-red-800 text-white">
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">DESCRIPCIÓN</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">TAG</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">PROG/NÓ PROG</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">ESTACION</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">AVANCE</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">OT</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">EJECUTANTE</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">SUBÁREA</th>
                  <th className="border border-red-700 p-3 text-center text-sm font-semibold">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {actividadesFiltradas.map((act, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150 group">
                    <td className="border border-gray-200 p-3 text-center text-sm">{act.descripcion}</td>
                    <td className="border border-gray-200 p-3 text-center text-sm font-mono text-gray-600">{act.tag}</td>
                    <td className="border border-gray-200 p-3 text-center text-sm font-mono text-gray-600">{act.progNoProg}</td>
                    <td className="border border-gray-200 p-3 text-center text-sm font-bold text-gray-700">{act.estacion}</td>
                    <td className="border border-gray-200 p-3 text-center text-sm">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {act.avance || '0%'}
                      </span>
                    </td>
                    <td className="border border-gray-200 p-3 text-center text-sm font-mono text-gray-600">{act.ot}</td>
                    <td className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700">{act.ejecutante}</td>
                    <td className="border border-gray-200 p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSubareaColor(act.subarea)}`}>
                        {act.subarea}
                      </span>
                    </td>
                    <td className="border border-gray-200 p-3 text-center">
                      <button
                        onClick={() => eliminarActividad(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium shadow hover:shadow-lg transform hover:scale-105 flex items-center justify-center mx-auto space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {actividadesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center p-12 text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-lg">📭 No hay actividades registradas</span>
                        <span className="text-sm text-gray-400">Agrega una nueva actividad usando el formulario</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón de exportación */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={exportarExcel}
            disabled={exportando || actividades.length === 0}
            className={`px-8 py-4 rounded-xl font-medium flex items-center space-x-3 transition-all duration-300 ${
              exportando || actividades.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
            }`}
          >
            {exportando ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Exportar a Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            💡 <strong className="mx-1">Consejo:</strong> Los datos se guardan automáticamente en tu navegador.
            <span className="mx-2">•</span>
            <span className="text-gray-400">v1.0.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
