-- Actualizar el rol de ernestoleonard8@gmail.com a admin
-- EJECUTA ESTO EN SUPABASE SQL EDITOR

UPDATE users 
SET role = 'admin'
WHERE email = 'ernestoleonard8@gmail.com';

-- Verificar el cambio
SELECT id, email, role, full_name
FROM users 
WHERE email = 'ernestoleonard8@gmail.com';
