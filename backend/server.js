require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// FIXED: Corrected the CORS origin syntax
app.use(cors({
    origin: 'https://rent-tracker-eight-theta.vercel.app' 
}));

app.use(express.json());

// Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Auth middleware - verifies the Supabase access token
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
};

// NEW: Added a root route so you don't get "Cannot GET /" 
app.get('/', (req, res) => {
    res.send('Rent Tracker API is Live!');
});

// --- Auth Routes ---

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Signup successful. Check your email to confirm.', user: data.user });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ session: data.session, user: data.user });
});

// --- Protected Payment Routes ---

// GET all payments
app.get('/api/payments', requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });
    
    if (error) return res.status(400).json(error);
    res.json(data);
});

// POST a new payment
app.post('/api/payments', requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .insert([req.body]);
    
    if (error) return res.status(400).json(error);
    res.json({ success: true });
});

// DELETE a payment
app.delete('/api/payments/:id', requireAuth, async (req, res) => {
    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', req.params.id);
    
    if (error) return res.status(400).json(error);
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));