-- Check if there are multiple triggers on points_transactions
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'public.points_transactions'::regclass;