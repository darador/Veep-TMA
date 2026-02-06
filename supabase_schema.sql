-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'supervisor', 'technician')) NOT NULL DEFAULT 'technician',
    supervisor_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EPP CATALOG TABLE
CREATE TABLE public.epp_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Head', 'Hands', 'Feet'
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INSPECTIONS TABLE
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES public.users(id) NOT NULL,
    supervisor_id UUID REFERENCES public.users(id), -- Nullable if self-initiated? Actually plan says Supervisor initiates or Tech initiates.
    type TEXT CHECK (type IN ('audit', 'voluntary')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. INSPECTION ITEMS (Details)
CREATE TABLE public.inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    epp_id UUID REFERENCES public.epp_catalog(id) NOT NULL,
    status TEXT CHECK (status IN ('ok', 'damaged', 'missing', 'needs_replacement')) NOT NULL,
    photo_url TEXT, -- Required if critical or not ok
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Simple for MVP)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epp_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for now (Magic Link simulation might rely on simple access, or we can secure it later)
-- For MVP speed:
CREATE POLICY "Public CRUD" ON public.users FOR ALL USING (true);
CREATE POLICY "Public CRUD" ON public.epp_catalog FOR ALL USING (true);
CREATE POLICY "Public CRUD" ON public.inspections FOR ALL USING (true);
CREATE POLICY "Public CRUD" ON public.inspection_items FOR ALL USING (true);
