-- Standardize lead "industry" values into a fixed canonical list of 18 categories.
-- Preserves the original scraped value in `industry_raw` so we can re-map later if a rule misses.

-- 1. Snapshot original values
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry_raw TEXT;
UPDATE leads SET industry_raw = industry WHERE industry_raw IS NULL;

-- 2. Map existing free-text industry values to canonical categories.
--    Order matters: more specific patterns first.

UPDATE leads SET industry = 'Hotels'
  WHERE industry ILIKE '%hotel%' OR industry ILIKE '%hostel%' OR industry ILIKE '%guesthouse%'
     OR industry ILIKE '%guest house%' OR industry ILIKE '%resort%' OR industry ILIKE '%lodging%'
     OR industry ILIKE '%accommodation%' OR industry ILIKE '%b&b%' OR industry ILIKE '%inn%'
     OR industry ILIKE '%სასტუმრო%';

UPDATE leads SET industry = 'Restaurants & Cafes'
  WHERE industry ILIKE '%restaurant%' OR industry ILIKE '%cafe%' OR industry ILIKE '%café%'
     OR industry ILIKE '%bistro%' OR industry ILIKE '%bar%' OR industry ILIKE '%pub%'
     OR industry ILIKE '%bakery%' OR industry ILIKE '%pizza%' OR industry ILIKE '%food%'
     OR industry ILIKE '%dining%' OR industry ILIKE '%eatery%' OR industry ILIKE '%catering%'
     OR industry ILIKE '%რესტორან%' OR industry ILIKE '%კაფე%';

UPDATE leads SET industry = 'E-commerce'
  WHERE industry ILIKE '%e-commerce%' OR industry ILIKE '%ecommerce%'
     OR industry ILIKE '%online shop%' OR industry ILIKE '%online store%'
     OR industry ILIKE '%webshop%' OR industry ILIKE '%online retail%';

UPDATE leads SET industry = 'Shops / Retail'
  WHERE industry ILIKE '%shop%' OR industry ILIKE '%store%' OR industry ILIKE '%retail%'
     OR industry ILIKE '%boutique%' OR industry ILIKE '%market%' OR industry ILIKE '%supermarket%'
     OR industry ILIKE '%მაღაზია%';

UPDATE leads SET industry = 'Real Estate'
  WHERE industry ILIKE '%real estate%' OR industry ILIKE '%realtor%' OR industry ILIKE '%realty%'
     OR industry ILIKE '%property%' OR industry ILIKE '%broker%' OR industry ILIKE '%agent%'
     OR industry ILIKE '%უძრავი%';

UPDATE leads SET industry = 'Law Firms'
  WHERE industry ILIKE '%law%' OR industry ILIKE '%legal%' OR industry ILIKE '%attorney%'
     OR industry ILIKE '%lawyer%' OR industry ILIKE '%advocate%' OR industry ILIKE '%notary%'
     OR industry ILIKE '%იურიდიუ%' OR industry ILIKE '%ადვოკატ%';

UPDATE leads SET industry = 'Medical / Clinics'
  WHERE industry ILIKE '%medical%' OR industry ILIKE '%clinic%' OR industry ILIKE '%hospital%'
     OR industry ILIKE '%doctor%' OR industry ILIKE '%dental%' OR industry ILIKE '%dentist%'
     OR industry ILIKE '%pharmacy%' OR industry ILIKE '%pharma%' OR industry ILIKE '%health%'
     OR industry ILIKE '%veterinary%' OR industry ILIKE '%vet %' OR industry ILIKE '%therapist%'
     OR industry ILIKE '%კლინიკ%' OR industry ILIKE '%სამედიცინო%' OR industry ILIKE '%აფთიაქ%';

UPDATE leads SET industry = 'Beauty & Wellness'
  WHERE industry ILIKE '%beauty%' OR industry ILIKE '%salon%' OR industry ILIKE '%spa%'
     OR industry ILIKE '%wellness%' OR industry ILIKE '%cosmetic%' OR industry ILIKE '%barber%'
     OR industry ILIKE '%massage%' OR industry ILIKE '%gym%' OR industry ILIKE '%fitness%'
     OR industry ILIKE '%yoga%' OR industry ILIKE '%nail%' OR industry ILIKE '%hair%'
     OR industry ILIKE '%სილამაზე%' OR industry ILIKE '%სალონ%';

UPDATE leads SET industry = 'Education / Schools'
  WHERE industry ILIKE '%school%' OR industry ILIKE '%education%' OR industry ILIKE '%university%'
     OR industry ILIKE '%college%' OR industry ILIKE '%academy%' OR industry ILIKE '%tutor%'
     OR industry ILIKE '%training%' OR industry ILIKE '%kindergarten%' OR industry ILIKE '%course%'
     OR industry ILIKE '%სკოლა%' OR industry ILIKE '%განათლება%' OR industry ILIKE '%უნივერსიტეტ%';

UPDATE leads SET industry = 'Construction'
  WHERE industry ILIKE '%construction%' OR industry ILIKE '%builder%' OR industry ILIKE '%building%'
     OR industry ILIKE '%contractor%' OR industry ILIKE '%renovation%' OR industry ILIKE '%plumbing%'
     OR industry ILIKE '%electrical%' OR industry ILIKE '%remodel%' OR industry ILIKE '%roofing%'
     OR industry ILIKE '%architect%' OR industry ILIKE '%სამშენებლო%' OR industry ILIKE '%მშენებლობა%';

UPDATE leads SET industry = 'Manufacturing / Production'
  WHERE industry ILIKE '%manufact%' OR industry ILIKE '%production%' OR industry ILIKE '%factory%'
     OR industry ILIKE '%industrial%' OR industry ILIKE '%producer%' OR industry ILIKE '%plant%'
     OR industry ILIKE '%წარმოება%';

UPDATE leads SET industry = 'Logistics / Transport'
  WHERE industry ILIKE '%logistic%' OR industry ILIKE '%transport%' OR industry ILIKE '%shipping%'
     OR industry ILIKE '%delivery%' OR industry ILIKE '%freight%' OR industry ILIKE '%cargo%'
     OR industry ILIKE '%taxi%' OR industry ILIKE '%courier%' OR industry ILIKE '%moving%'
     OR industry ILIKE '%ლოგისტიკ%' OR industry ILIKE '%ტრანსპორტ%';

UPDATE leads SET industry = 'Finance / Insurance'
  WHERE industry ILIKE '%bank%' OR industry ILIKE '%finance%' OR industry ILIKE '%financial%'
     OR industry ILIKE '%insurance%' OR industry ILIKE '%investment%' OR industry ILIKE '%credit%'
     OR industry ILIKE '%loan%' OR industry ILIKE '%accounting%' OR industry ILIKE '%audit%'
     OR industry ILIKE '%bookkeeping%' OR industry ILIKE '%ბანკ%' OR industry ILIKE '%ფინანს%'
     OR industry ILIKE '%დაზღვევ%';

UPDATE leads SET industry = 'IT / Tech'
  WHERE industry ILIKE '%it %' OR industry ILIKE '% it' OR industry ILIKE 'it'
     OR industry ILIKE '%tech%' OR industry ILIKE '%software%' OR industry ILIKE '%computer%'
     OR industry ILIKE '%web%dev%' OR industry ILIKE '%programming%' OR industry ILIKE '%cybersecurity%'
     OR industry ILIKE '%saas%' OR industry ILIKE '%digital%' OR industry ILIKE '%data%';

UPDATE leads SET industry = 'Marketing / Advertising'
  WHERE industry ILIKE '%marketing%' OR industry ILIKE '%advertising%' OR industry ILIKE '%pr %'
     OR industry ILIKE '%agency%' OR industry ILIKE '%media%' OR industry ILIKE '%design%'
     OR industry ILIKE '%branding%' OR industry ILIKE '%seo%' OR industry ILIKE '%creative%'
     OR industry ILIKE '%სარეკლამო%' OR industry ILIKE '%მარკეტინგ%';

UPDATE leads SET industry = 'Auto / Car services'
  WHERE industry ILIKE '%auto%' OR industry ILIKE '%car%' OR industry ILIKE '%vehicle%'
     OR industry ILIKE '%mechanic%' OR industry ILIKE '%tire%' OR industry ILIKE '%garage%'
     OR industry ILIKE '%autoservice%' OR industry ILIKE '%automotive%' OR industry ILIKE '%body shop%'
     OR industry ILIKE '%ავტო%';

UPDATE leads SET industry = 'Professional Services'
  WHERE industry ILIKE '%consult%' OR industry ILIKE '%business services%'
     OR industry ILIKE '%professional services%' OR industry ILIKE '%translation%'
     OR industry ILIKE '%hr%' OR industry ILIKE '%recruit%' OR industry ILIKE '%legal services%';

-- 3. Everything that didn't match a rule → 'Other'
UPDATE leads SET industry = 'Other'
  WHERE industry IS NOT NULL AND industry NOT IN (
    'Hotels', 'Restaurants & Cafes', 'Shops / Retail', 'E-commerce',
    'Real Estate', 'Law Firms', 'Medical / Clinics', 'Beauty & Wellness',
    'Education / Schools', 'Construction', 'Manufacturing / Production',
    'Logistics / Transport', 'Finance / Insurance', 'IT / Tech',
    'Marketing / Advertising', 'Auto / Car services',
    'Professional Services', 'Other'
  );

-- 4. Index for fast filtering
CREATE INDEX IF NOT EXISTS leads_industry_idx ON leads (industry);
