import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmsevkpcmdmxynvbvujj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtc2V2a3BjbWRteHludmJ2dWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTcyMTYsImV4cCI6MjA5MTYzMzIxNn0.VN6lDR0GKm8ZeL7MxrkV9ciux8hGqAI5crj4EkC66SI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
