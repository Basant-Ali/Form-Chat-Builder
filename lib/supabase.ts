import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghacnwsexhmupwxexsjn.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYWNud3NleGhtdXB3eGV4c2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMDA2MTQsImV4cCI6MjEwNzY3NjYxNH0.9GrnKuxTt0uFwOgT31qx6beu4PGXM2_1BtfprIgcEC0'

export const supabase = createClient(supabaseUrl, supabaseKey)