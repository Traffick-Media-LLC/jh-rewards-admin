-- Add shopify_variant_id to some sample products for testing
UPDATE products 
SET shopify_variant_id = CASE 
  WHEN name = 'Make Flavors Great Again Hat' THEN '123456789'
  WHEN name = 'Bellroy Venture Ready Pack' THEN '123456790'
  WHEN name = 'Solo Stove' THEN '123456791'
  WHEN name = 'Chick-fil-a $20 Gift Card' THEN '123456792'
  WHEN name = 'Amazon $20 Gift Card' THEN '123456793'
  ELSE shopify_variant_id
END
WHERE name IN ('Make Flavors Great Again Hat', 'Bellroy Venture Ready Pack', 'Solo Stove', 'Chick-fil-a $20 Gift Card', 'Amazon $20 Gift Card');