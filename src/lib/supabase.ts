import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tgcbcmgsofpiemibfqbu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnY2JjbWdzb2ZwaWVtaWJmcWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTkxOTQsImV4cCI6MjA4MzE5NTE5NH0.GcpJyEvHfo3CidnUP9i1Bj8HkbfC9Nzv44up1yTnfA4'

export const supabase = createClient(supabaseUrl, supabaseKey)