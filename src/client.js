import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_KEY} from '../config.js';
export const db=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'athar-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
