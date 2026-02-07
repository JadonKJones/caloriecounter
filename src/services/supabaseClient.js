import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bexdrymwepeqzaycnrhy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleGRyeW13ZXBlcXpheWNucmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njg1NTgsImV4cCI6MjA4NjA0NDU1OH0.6mKOblR7iDTJauRmPyR8xK053S2tnK--vhFHHdx3ZFg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)