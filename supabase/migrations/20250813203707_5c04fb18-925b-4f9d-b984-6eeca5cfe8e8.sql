-- Fix spelling of "houshold" to "household" in products table
UPDATE products 
SET category = 'household' 
WHERE category = 'houshold';