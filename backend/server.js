require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET all payments
app.get('/api/payments', async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });
    
    if (error) return res.status(400).json(error);
    res.json(data);
});

// POST a new payment
app.post('/api/payments', async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .insert([req.body]);
    
    if (error) return res.status(400).json(error);
    res.json({ success: true });
});

// DELETE a payment
app.delete('/api/payments/:id', async (req, res) => {
    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', req.params.id);
    
    if (error) return res.status(400).json(error);
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
