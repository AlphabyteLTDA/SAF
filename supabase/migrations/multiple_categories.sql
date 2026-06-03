-- Migrate the 'category' column to 'TEXT[]'

-- 1. Create a new array column
ALTER TABLE books ADD COLUMN new_category TEXT[];

-- 2. Populate the new column with the old data (converted to single-element arrays)
-- If the category is NULL or empty, we skip the array conversion or put an empty array/null
UPDATE books 
SET new_category = ARRAY[category]
WHERE category IS NOT NULL AND category != '';

-- 3. Drop the old column
ALTER TABLE books DROP COLUMN category;

-- 4. Rename the new column back to the original name
ALTER TABLE books RENAME COLUMN new_category TO category;
