const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Servidor iniciado...');

// ========== CONEXIÓN A SUPABASE CON POOLER ==========
// Usando la URL con pooler para mejor conexión
const connectionString = 'postgresql://postgres:PYqzqvT*6/vKb!u@db.lznaxrbcyhxtwptfnekt.supabase.co:5432/postgres?sslmode=require';

console.log('📊 Conectando a Supabase...');

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

// ========== RUTAS ==========

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time, version() as version');
        res.json({ 
            success: true, 
            message: 'Conexión a Supabase exitosa',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

app.get('/api/actividades', async (req, res) => {
    try {
        console.log('📡 GET /api/actividades');
        const result = await pool.query('SELECT * FROM actividades ORDER BY id DESC');
        console.log(`✅ Enviando ${result.rows.length} actividades`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ 
            error: 'Error al obtener actividades',
            details: error.message 
        });
    }
});

app.post('/api/actividades', async (req, res) => {
    try {
        console.log('📥 POST /api/actividades');
        const { descripcion, tag, progNoProg, estacion, avance, ot, ejecutante, subarea, fecha, area } = req.body;
        
        const result = await pool.query(
            `INSERT INTO actividades 
             (descripcion, tag, prog_no_prog, estacion, avance, ot, ejecutante, subarea, fecha, area) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [descripcion, tag || 'N/A', progNoProg || 'N/A', estacion || 'JAGUAR', 
             avance || '0%', ot || 'N/A', ejecutante || 'N/A', subarea || 'MECANICA', 
             fecha || new Date().toLocaleDateString('es-ES'), area || 'AREA O SISTEMA']
        );
        
        console.log('✅ Actividad guardada en Supabase');
        res.json({ success: true, message: 'Actividad agregada', actividad: result.rows[0] });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: 'Error al agregar actividad', details: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [usuario]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario incorrecto' });
        }
        const user = result.rows[0];
        if (contrasena === user.password) {
            const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64');
            res.json({ success: true, token, role: user.role });
        } else {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/verify', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        res.json({ valid: true, role: decoded.role });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

app.post('/api/export-excel', async (req, res) => {
    try {
        const { fecha, area, token } = req.body;
        
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'No autorizado' });
            }
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        const result = await pool.query('SELECT * FROM actividades ORDER BY subarea, created_at');
        const actividades = result.rows;
        
        if (actividades.length === 0) {
            return res.status(400).json({ error: 'No hay actividades' });
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Gestion Actividades');
        
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
            r.getCell(1).value = act.descripcion;
            r.getCell(2).value = act.tag;
            r.getCell(3).value = act.prog_no_prog;
            r.getCell(4).value = act.estacion;
            r.getCell(5).value = act.avance;
            r.getCell(6).value = act.ot;
            r.getCell(7).value = act.ejecutante;
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
    } catch (error) {
        console.error('❌ Error en export:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🔐 Credenciales: Gestion / 2026`);
});

module.exports = app;
