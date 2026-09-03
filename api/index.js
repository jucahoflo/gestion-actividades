const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(require('cors')());

console.log('🚀 Servidor iniciado...');

// ========== CONEXIÓN A SUPABASE ==========
const pool = new Pool({
    connectionString: 'postgresql://postgres:PYqzqvT*6/vKb!u@db.lznaxrbcyhxtwptfnekt.supabase.co:5432/postgres?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

console.log('📊 Conectando a Supabase...');

// ========== RUTAS ==========

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.get('/api/actividades', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM actividades ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/actividades', async (req, res) => {
    try {
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
        res.json({ success: true, message: 'Actividad agregada', actividad: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
