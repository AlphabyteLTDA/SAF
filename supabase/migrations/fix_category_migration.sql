-- ============================================
-- LIMPEZA SEGURA DOS DADOS DE CATEGORIA
-- Este script corrige livros cujas categorias 
-- ficaram como '["Categoria"]' (string JSON dentro do array)
-- sem perder NENHUM dado.
-- ============================================

-- Primeiro, vamos VER quais livros precisam de correção:
SELECT id, title, category
FROM books 
WHERE category::text LIKE '%[%'
ORDER BY title;

-- Para corrigir, rode o UPDATE abaixo.
-- Ele pega o primeiro elemento do array, faz parse do JSON
-- e transforma de volta em array limpo.
-- SÓ AFETA livros com formato quebrado.

UPDATE books
SET category = (
    SELECT array_agg(elem)
    FROM (
        SELECT jsonb_array_elements_text(category[1]::jsonb) AS elem
    ) sub
)
WHERE array_length(category, 1) = 1
  AND category[1] LIKE '[%';