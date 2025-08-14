-- Check the current trigger function
SELECT pg_get_functiondef(oid) as function_definition 
FROM pg_proc 
WHERE proname = 'update_points_on_insert';