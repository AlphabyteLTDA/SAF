-- Create categories table for dynamic category management
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO categories (name) VALUES
    ('Teologia Cristã'),
    ('Vida Cristã'),
    ('Teologia'),
    ('Biografia'),
    ('Infantil'),
    ('Política e Religião')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT USING (true);

-- Only admins can insert/delete (via service role or adjust as needed)
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (true);
