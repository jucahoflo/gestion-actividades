const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// ========== CONFIGURACIÓN CORS CORRECTA ==========
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/actividades', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM actividades ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
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
        
        console.log('✅ Actividad guardada');
        res.json({ success: true, message: 'Actividad agregada', actividad: result.rows[0] });
    } catch (error) {
        console.error('❌ Error:', error.message);
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
        console.error('❌ Error:', error.message);
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🔐 Credenciales: Gestion / 2026`);
});
