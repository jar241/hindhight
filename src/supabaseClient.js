import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyfdlibrbbfcohxhugdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZmRsaWJyYmJmY29oeGh1Z2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTcxMDUsImV4cCI6MjA2NjgzMzEwNX0.s6xdvsNeI_GjQn7FTF0feNBfSGjRoqrcF2xid2JgJxg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 