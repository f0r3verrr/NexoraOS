-- Migration 005 — Social link field for contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS social_link text;
