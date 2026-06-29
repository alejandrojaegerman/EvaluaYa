-- Direct fix for reported duplicate: "sucre" -> "Sucre"
UPDATE public.assessments
SET municipality = 'Sucre'
WHERE state = 'Distrito Capital'
  AND municipality IS NOT NULL
  AND lower(trim(municipality)) = 'sucre'
  AND municipality <> 'Sucre';

-- General normalization: collapse case-only duplicates within the same state to
-- the variant whose first character is uppercase (treated as canonical).
WITH variants AS (
  SELECT DISTINCT
    state,
    lower(trim(municipality)) AS muni_key,
    trim(municipality) AS muni_val
  FROM public.assessments
  WHERE municipality IS NOT NULL AND trim(municipality) <> ''
),
canon AS (
  SELECT DISTINCT ON (state, muni_key)
    state, muni_key, muni_val AS canonical
  FROM variants
  ORDER BY state, muni_key,
    (muni_val ~ '^[A-ZÁÉÍÓÚÑ]') DESC, muni_val
)
UPDATE public.assessments a
SET municipality = c.canonical
FROM canon c
WHERE a.state = c.state
  AND lower(trim(a.municipality)) = c.muni_key
  AND trim(a.municipality) <> c.canonical;