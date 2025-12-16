-- ============================================
-- Migration: Add estimatedCost to scheduled_maintenances
-- Date: December 17, 2025
-- ============================================
-- 
-- Menambahkan kolom estimatedCost untuk menyimpan biaya estimasi
-- perawatan terjadwal yang akan dicatat saat maintenance selesai
-- 
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Add estimatedCost column to scheduled_maintenances table
ALTER TABLE public.scheduled_maintenances 
ADD COLUMN IF NOT EXISTS "estimatedCost" numeric DEFAULT 0;

-- Add comment to column
COMMENT ON COLUMN public.scheduled_maintenances."estimatedCost" IS 'Estimasi biaya perawatan yang akan dicatat saat maintenance selesai';
