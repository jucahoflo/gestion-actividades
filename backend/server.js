const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configuración de PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'gestion_actividades',
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Login
app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1',
            [usuario]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos' 
            });
        }
        
        const user = result.rows[0];
        
        if (contrasena === user.password) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'mi_clave_secreta_2026',
                { expiresIn: '24h' }
            );
            
            res.json({ 
                success: true, 
                message: 'Login exitoso',
                token,
                role: user.role
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos' 
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Verificar token
app.post('/api/verify', async (req, res) => {
    const { token } = req.body;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_clave_secreta_2026');
        res.json({ valid: true, role: decoded.role });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

// ==================== RUTAS DE ACTIVIDADES ====================

// Obtener todas las actividades
app.get('/api/actividades', async (req, res) => {
    try {
        console.log('📡 Recibiendo petición GET /api/actividades');
        const result = await pool.query('SELECT * FROM actividades ORDER BY created_at DESC');
        console.log(`✅ Enviando ${result.rows.length} actividades`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error obteniendo actividades:', error);
        res.status(500).json({ error: 'Error al obtener actividades', details: error.message });
    }
});

// Agregar nueva actividad
app.post('/api/actividades', async (req, res) => {
    const { descripcion, tag, progNoProg, estacion, avance, ot, ejecutante, subarea, fecha, area } = req.body;
    
    console.log('📥 Recibiendo nueva actividad:', req.body);
    
    try {
        const result = await pool.query(
            `INSERT INTO actividades 
             (descripcion, tag, prog_no_prog, estacion, avance, ot, ejecutante, subarea, fecha, area) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [descripcion, tag, progNoProg, estacion, avance, ot, ejecutante, subarea, fecha, area]
        );
        
        console.log('✅ Actividad guardada:', result.rows[0]);
        res.json({ 
            success: true, 
            message: 'Actividad agregada correctamente',
            actividad: result.rows[0] 
        });
    } catch (error) {
        console.error('❌ Error agregando actividad:', error);
        res.status(500).json({ error: 'Error al agregar actividad', details: error.message });
    }
});

// Eliminar actividad
app.delete('/api/actividades/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ Eliminando actividad ID: ${id}`);
    
    try {
        await pool.query('DELETE FROM actividades WHERE id = $1', [id]);
        res.json({ success: true, message: 'Actividad eliminada' });
    } catch (error) {
        console.error('❌ Error eliminando actividad:', error);
        res.status(500).json({ error: 'Error al eliminar actividad' });
    }
});

// Eliminar todas las actividades
app.delete('/api/actividades', async (req, res) => {
    console.log('🗑️ Eliminando todas las actividades');
    try {
        await pool.query('DELETE FROM actividades');
        res.json({ success: true, message: 'Todas las actividades eliminadas' });
    } catch (error) {
        console.error('❌ Error eliminando actividades:', error);
        res.status(500).json({ error: 'Error al eliminar actividades' });
    }
});

// ==================== RUTA DE SALUD ====================

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// ==================== EXPORTAR A EXCEL ====================

app.post('/api/export-excel', async (req, res) => {
    try {
        const { fecha, area, token } = req.body;

        // Verificar token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_clave_secreta_2026');
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'No autorizado - Se requiere rol de administrador' });
            }
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        // Obtener todas las actividades
        const result = await pool.query(
            'SELECT * FROM actividades ORDER BY subarea, created_at'
        );
        const actividades = result.rows;

        if (actividades.length === 0) {
            return res.status(400).json({ error: 'No hay actividades para exportar' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Gestion Actividades');

        worksheet.columns = [
            { header: 'DESCRIPCIÓN DE ACTIVIDAD', key: 'descripcion', width: 35 },
            { header: 'TAG', key: 'tag', width: 22 },
            { header: 'PROG/NÓ PROG', key: 'progNoProg', width: 18 },
            { header: 'ESTACION', key: 'estacion', width: 15 },
            { header: 'AVANCE', key: 'avance', width: 15 },
            { header: 'OT', key: 'ot', width: 18 },
            { header: 'EJECUTANTE', key: 'ejecutante', width: 20 }
        ];

        // TÍTULO
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'GESTIÓN DE ACTIVIDADES POR ÁREA';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
        worksheet.getRow(1).height = 35;

        // FECHA Y ÁREA
        worksheet.getCell('A2').value = 'FECHA';
        worksheet.getCell('A2').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('B2:G2');
        worksheet.getCell('B2').value = fecha || new Date().toLocaleDateString('es-ES');
        worksheet.getCell('B2').font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };
        worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 22;

        worksheet.getCell('A3').value = 'AREA';
        worksheet.getCell('A3').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
        worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('B3:G3');
        worksheet.getCell('B3').value = area || 'AREA O SISTEMA';
        worksheet.getCell('B3').font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };
        worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(3).height = 22;

        // ENCABEZADOS
        const headerRow = worksheet.getRow(4);
        headerRow.values = [
            'DESCRIPCIÓN DE ACTIVIDAD',
            'TAG',
            'PROG/NÓ PROG',
            'ESTACION',
            'AVANCE',
            'OT',
            'EJECUTANTE'
        ];
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        headerRow.height = 25;

        // DATOS
        let currentRow = 5;
        let subareaActual = '';

        const addSubareaRow = (subarea) => {
            const row = worksheet.getRow(currentRow);
            worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
            const cell = row.getCell(1);
            cell.value = subarea.toUpperCase();
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
            row.height = 22;
            currentRow++;
        };

        actividades.forEach((act) => {
            if (act.subarea && act.subarea.toUpperCase() !== subareaActual) {
                subareaActual = act.subarea.toUpperCase();
                addSubareaRow(subareaActual);
            }

            const row = worksheet.getRow(currentRow);
            row.getCell(1).value = act.descripcion || '';
            row.getCell(2).value = act.tag || '';
            row.getCell(3).value = act.prog_no_prog || '';
            row.getCell(4).value = act.estacion || '';
            row.getCell(5).value = act.avance || '';
            row.getCell(6).value = act.ot || '';
            row.getCell(7).value = act.ejecutante || '';

            row.eachCell((cell) => {
                cell.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            row.height = 20;
            currentRow++;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=gestion_actividades_${fecha.replace(/\//g, '-')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generando Excel:', error);
        res.status(500).json({ 
            error: 'Error al generar el archivo Excel',
            details: error.message 
        });
    }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(port, async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log(`✅ Conectado a PostgreSQL`);
        console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
        console.log(`📊 Endpoint: http://localhost:${port}/api/export-excel`);
        console.log(`🔐 Admin: Usuario: Gestion | Contraseña: 2026`);
        console.log(`📱 Accesible desde cualquier dispositivo`);
        console.log(`\n📋 RUTAS DISPONIBLES:`);
        console.log(`   GET  /api/actividades  - Obtener todas las actividades`);
        console.log(`   POST /api/actividades  - Agregar nueva actividad`);
        console.log(`   POST /api/login        - Iniciar sesión`);
        console.log(`   POST /api/export-excel - Exportar a Excel`);
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        console.log('\n⚠️  Asegúrate de:');
        console.log('1. PostgreSQL está instalado y corriendo');
        console.log('2. Las credenciales en .env son correctas');
        console.log('3. La base de datos "gestion_actividades" existe');
    }
});
