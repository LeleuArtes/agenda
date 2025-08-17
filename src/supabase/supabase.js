import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydfqxiujpxebekksopct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZnF4aXVqcHhlYmVra3NvcGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODYxMjEsImV4cCI6MjA3MDc2MjEyMX0.wDYteX7mOHv6lplMQkegXPjHM9qCcPbIEGZxqavUkc8';

export const supabase = createClient(supabaseUrl, supabaseKey);
