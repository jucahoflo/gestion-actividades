const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Iniciando servidor...');

// ========== CONFIGURACIÓN DE NEON ==========
const pool = new Pool({
    host: 'ep-restless-field-acue93wu-pooler.sa-east-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_UALkiTHvq40u',
    database: 'neondb',
    ssl: { rejectUnauthorized: false }
});

console.log('📊 Intentando conectar a Neon...');

// ========== PROBAR CONEXIÓN AL INICIAR ==========
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERROR DE CONEXIÓN A NEON:', err.message);
        console.error('❌ Detalles:', err);
        return;
    }
    console.log('✅ Conexión a Neon exitosa!');
    release();
});

// ========== RUTAS ==========

// Health check - simple
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

// Health check con base de datos
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time, version() as version');
        res.json({ 
            success: true,
            message: 'Conexión a Neon exitosa',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error en db-test:', error.message);
        res.status(500).json({ 
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Obtener todas las actividades
app.get('/api/actividades', async (req, res) => {
    try {
        console.log('📡 GET /api/actividades');
        const result = await pool.query('SELECT * FROM actividades ORDER BY id DESC');
        console.log(`✅ Enviando ${result.rows.length} actividades`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error en /api/actividades:', error.message);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al obtener actividades',
            message: error.message,
            details: error.stack
        });
    }
});

// Agregar actividad
app.post('/api/actividades', async (req, res) => {
    try {
        console.log('📥 POST /api/actividades');
        console.log('📦 Body recibido:', req.body);
        
        const { descripcion, tag, progNoProg, estacion, avance, ot, ejecutante, subarea, fecha, area } = req.body;
        
        // Validar descripción
        if (!descripcion) {
            return res.status(400).json({ error: 'La descripción es obligatoria' });
        }
        
        const result = await pool.query(
            `INSERT INTO actividades 
             (descripcion, tag, prog_no_prog, estacion, avance, ot, ejecutante, subarea, fecha, area) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [descripcion, tag || 'N/A', progNoProg || 'N/A', estacion || 'JAGUAR', 
             avance || '0%', ot || 'N/A', ejecutante || 'N/A', subarea || 'MECANICA', 
             fecha || new Date().toLocaleDateString('es-ES'), area || 'AREA O SISTEMA']
        );
        
        console.log('✅ Actividad guardada:', result.rows[0]);
        res.json({ success: true, message: 'Actividad agregada', actividad: result.rows[0] });
    } catch (error) {
        console.error('❌ Error en POST /api/actividades:', error.message);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al agregar actividad',
            message: error.message,
            details: error.stack
        });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        console.log('🔐 Login intento:', usuario);
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [usuario]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario incorrecto' });
        }
        
        const user = result.rows[0];
        console.log('👤 Usuario encontrado:', user.username);
        
        if (contrasena === user.password) {
            const token = Buffer.from(JSON.stringify({ 
                id: user.id, 
                role: user.role,
                username: user.username 
            })).toString('base64');
            
            res.json({ 
                success: true, 
                message: 'Login exitoso',
                token, 
                role: user.role 
            });
        } else {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Verificar token
app.post('/api/verify', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        console.log('🔑 Token verificado:', decoded.username);
        res.json({ valid: true, role: decoded.role });
    } catch (error) {
        console.error('❌ Token inválido:', error.message);
        res.status(401).json({ valid: false });
    }
});

// Exportar Excel
app.post('/api/export-excel', async (req, res) => {
    try {
        const { fecha, area, token } = req.body;
        
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'No autorizado' });
            }
            console.log('📊 Exportando Excel para:', decoded.username);
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        const result = await pool.query('SELECT * FROM actividades ORDER BY subarea, created_at');
        const actividades = result.rows;
        
        if (actividades.length === 0) {
            return res.status(400).json({ error: 'No hay actividades' });
        }
        
        console.log(`📊 Exportando ${actividades.length} actividades`);
        
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
        
        // Título
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'GESTIÓN DE ACTIVIDADES POR ÁREA';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
        worksheet.getRow(1).height = 35;
        
        // Fecha y Área
        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `FECHA: ${fecha || new Date().toLocaleDateString('es-ES')}`;
        worksheet.getCell('A2').font = { name: 'Arial', size: 11, bold: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:G3');
        worksheet.getCell('A3').value = `AREA: ${area || 'AREA O SISTEMA'}`;
        worksheet.getCell('A3').font = { name: 'Arial', size: 11, bold: true };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        // Encabezados
        const headerRow = worksheet.getRow(4);
        headerRow.values = ['DESCRIPCIÓN', 'TAG', 'PROG/NÓ PROG', 'ESTACION', 'AVANCE', 'OT', 'EJECUTANTE'];
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        
        // Datos
        let row = 5;
        actividades.forEach((act) => {
            const r = worksheet.getRow(row);
            r.getCell(1).value = act.descripcion || '';
            r.getCell(2).value = act.tag || '';
            r.getCell(3).value = act.prog_no_prog || '';
            r.getCell(4).value = act.estacion || '';
            r.getCell(5).value = act.avance || '';
            r.getCell(6).value = act.ot || '';
            r.getCell(7).value = act.ejecutante || '';
            r.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
            row++;
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=gestion_actividades_${fecha.replace(/\//g, '-')}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
        console.log('✅ Excel exportado correctamente');
    } catch (error) {
        console.error('❌ Error en export:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== INICIAR SERVIDOR ==========
module.exports = app;

console.log('✅ Servidor listo');
console.log('📊 Intentando conectar a Neon...');
console.log('🔐 Credenciales: Gestion / 2026');
console.log('');
console.log('📋 Endpoints disponibles:');
console.log('  GET  /api/health       - Estado del servidor');
console.log('  GET  /api/db-test      - Prueba de conexión a Neon');
console.log('  GET  /api/actividades  - Obtener actividades');
console.log('  POST /api/actividades  - Agregar actividad');
console.log('  POST /api/login        - Iniciar sesión');
console.log('  POST /api/export-excel - Exportar a Excel');
