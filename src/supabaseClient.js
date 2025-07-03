
// 환경변수에서 값 읽기 (.env 파일 필요)
//const supabaseUrl = 'https://yyfdlibrbbfcohxhugdv.supabase.co'; // 본인 프로젝트 ref로 변경
//const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // .env에 저장한 값

//const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

//export default supabase; //

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyfdlibrbbfcohxhugdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZmRsaWJyYmJmY29oeGh1Z2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTcxMDUsImV4cCI6MjA2NjgzMzEwNX0.s6xdvsNeI_GjQn7FTF0feNBfSGjRoqrcF2xid2JgJxg';
 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;