-- ======================================================================
-- B2B Multi-Tenant AI SaaS (노무체크 AI) Supabase DDL & Strict RLS Policies
-- Financial Grade Privacy & Strict Tenant Isolation Schema
-- ======================================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Custom Enum Types
CREATE TYPE user_role AS ENUM ('super_admin', 'agency_admin', 'company_admin', 'employee');
CREATE TYPE contract_type AS ENUM ('full_time', 'part_time', 'contractual', 'daily');

-- 2. Tenants Table (세무·노무 사무소 / 독점 SaaS 테넌트)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    biz_no VARCHAR(20) UNIQUE NOT NULL,
    license_no VARCHAR(50),
    owner_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Companies Table (사무소의 위탁 거래처 기업)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    biz_no VARCHAR(20) NOT NULL,
    ceo_name VARCHAR(100) NOT NULL,
    industry_type VARCHAR(100),
    employee_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_biz_no UNIQUE (tenant_id, biz_no)
);

-- 4. Users Table (Supabase Auth & RBAC Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Employees Table (근로자 상세 & AES-256 민감 데이터)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    -- AES-256 Encrypted Sensitive Fields (Zero Plaintext Storage)
    rrn_encrypted TEXT NOT NULL, 
    account_encrypted TEXT NOT NULL,
    bank_name VARCHAR(50),
    contract_type contract_type DEFAULT 'full_time',
    base_salary NUMERIC(15, 2) DEFAULT 0,
    hired_date DATE NOT NULL,
    retired_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Labor Calculation Logs Table (오차 0% 백엔드 정밀 계산 이력)
CREATE TABLE IF NOT EXISTS public.labor_calculation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    calculated_by UUID NOT NULL REFERENCES public.users(id),
    weekly_hours NUMERIC(6, 2) NOT NULL,
    overtime_hours NUMERIC(6, 2) DEFAULT 0,
    night_hours NUMERIC(6, 2) DEFAULT 0,
    holiday_hours NUMERIC(6, 2) DEFAULT 0,
    base_calc_hours NUMERIC(6, 2) DEFAULT 209.00, -- 174h basic + 35h weekly holiday
    total_paid_hours NUMERIC(6, 2) NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL,
    calculated_monthly_wage NUMERIC(15, 2) NOT NULL,
    is_minimum_wage_compliant BOOLEAN DEFAULT TRUE,
    calculation_breakdown JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Agent AI Session Logs Table (5대 수석 에이전트 대화 및 슬롯 필링 이력)
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    active_agent VARCHAR(50) NOT NULL, -- LaborLawChief, IndustrialAccidentChief, etc.
    slot_state JSONB DEFAULT '{}'::jsonb,
    is_completed BOOLEAN DEFAULT FALSE,
    chat_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Industrial Accidents Table (산재 보상 & 질병/사고 민감 정보 AES-256 저장)
CREATE TABLE IF NOT EXISTS public.industrial_accidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    accident_date DATE NOT NULL,
    accident_type VARCHAR(50) NOT NULL, -- 'accident', 'disease', 'commuting'
    -- AES-256 Encrypted Sensitive Health & Disease Detail
    disease_info_encrypted TEXT NOT NULL, 
    accident_cause_detail TEXT,
    average_daily_wage NUMERIC(15, 2) NOT NULL,
    adjusted_average_daily_wage NUMERIC(15, 2) NOT NULL, -- 통상임금 보정 반영 1일 임금
    off_work_days INT DEFAULT 0,
    daily_off_work_allowance NUMERIC(15, 2) NOT NULL, -- 70% 및 상하한 적용
    total_off_work_allowance NUMERIC(15, 2) NOT NULL,
    disability_grade INT DEFAULT 0,
    total_estimated_compensation NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'draft', -- draft, submitted, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation per Tenant, Company, User
-- ======================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_calculation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrial_accidents ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get Current User Role & Tenant ID
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE (user_id UUID, tenant_id UUID, company_id UUID, role user_role) AS $$
    SELECT id, tenant_id, company_id, role
    FROM public.users
    WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------
-- RLS: Tenants Table
-- ----------------------------------------------------------------------
CREATE POLICY tenants_isolation_policy ON public.tenants
    FOR ALL USING (
        id IN (SELECT tenant_id FROM public.get_current_user_info())
        OR (SELECT role FROM public.get_current_user_info()) = 'super_admin'
    );

-- ----------------------------------------------------------------------
-- RLS: Companies Table
-- ----------------------------------------------------------------------
CREATE POLICY companies_isolation_policy ON public.companies
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.get_current_user_info())
        AND (
            (SELECT role FROM public.get_current_user_info()) IN ('super_admin', 'agency_admin')
            OR id = (SELECT company_id FROM public.get_current_user_info())
        )
    );

-- ----------------------------------------------------------------------
-- RLS: Employees Table (Strict Multi-Tenancy & Privacy)
-- ----------------------------------------------------------------------
CREATE POLICY employees_isolation_policy ON public.employees
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.get_current_user_info())
        AND (
            (SELECT role FROM public.get_current_user_info()) IN ('super_admin', 'agency_admin')
            OR (
                (SELECT role FROM public.get_current_user_info()) = 'company_admin'
                AND company_id = (SELECT company_id FROM public.get_current_user_info())
            )
            OR (
                (SELECT role FROM public.get_current_user_info()) = 'employee'
                AND user_id = auth.uid()
            )
        )
    );

-- ----------------------------------------------------------------------
-- RLS: Labor Calculation Logs Policy
-- ----------------------------------------------------------------------
CREATE POLICY calculation_logs_isolation_policy ON public.labor_calculation_logs
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.get_current_user_info())
        AND (
            (SELECT role FROM public.get_current_user_info()) IN ('super_admin', 'agency_admin')
            OR company_id = (SELECT company_id FROM public.get_current_user_info())
        )
    );

-- ----------------------------------------------------------------------
-- RLS: Agent Sessions Policy
-- ----------------------------------------------------------------------
CREATE POLICY agent_sessions_isolation_policy ON public.agent_sessions
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ----------------------------------------------------------------------
-- RLS: Industrial Accidents Policy (Company/Tenant Strict Isolation)
-- ----------------------------------------------------------------------
CREATE POLICY industrial_accidents_isolation_policy ON public.industrial_accidents
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.get_current_user_info())
        AND (
            (SELECT role FROM public.get_current_user_info()) IN ('super_admin', 'agency_admin')
            OR (
                (SELECT role FROM public.get_current_user_info()) = 'company_admin'
                AND company_id = (SELECT company_id FROM public.get_current_user_info())
            )
            OR (
                (SELECT role FROM public.get_current_user_info()) = 'employee'
                AND employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
            )
        )
    );

