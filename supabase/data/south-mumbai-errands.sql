-- Errands in South Mumbai (Colaba, Fort, Churchgate, Lower Parel): pharmacies,
-- ATMs, a SIM store, dry cleaning and coworking, for side events in the
-- south. From OpenStreetMap (© OpenStreetMap contributors, ODbL); hours are
-- OpenStreetMap's and unchecked. They go in as "Waiting", so an admin checks
-- each one in Admin → Places before it shows on the map (Edit fixes a pin).
-- Run once in the SQL Editor. Running it again skips places already added.

INSERT INTO community_places (name, category, lat, lng, area, tip, price, added_by_name, owner_id, status)
SELECT v.name, v.category, v.lat, v.lng, v.area, v.tip, NULL, 'Mumbai Onchain team', 'ac29f408-0231-4419-a157-462c5f637a0c', 'pending'
FROM (VALUES
  -- Pharmacies
  ('Noble Plus', 'health', 18.93076, 72.82569, 'Churchgate', 'Pharmacy, open 24/7. Near Churchgate station.'),
  ('Noble Plus Cuffe Parade', 'health', 18.91663, 72.81766, 'Cuffe Parade', 'Pharmacy, open 24/7.'),
  ('Gen Medical 24 Hrs', 'health', 18.91885, 72.82951, 'Colaba', 'Pharmacy, open round the clock.'),
  ('Sheetal Medical & General Stores', 'health', 18.92283, 72.83217, 'Colaba', 'Pharmacy on Tulloch Road, near the Gateway.'),
  ('Darshan Pharmacy', 'health', 19.00900, 72.83086, 'Lower Parel', 'Pharmacy on Gokhale Road, 8:30 am to 11:30 pm.'),
  ('Apollo Pharmacy', 'health', 19.00165, 72.81529, 'Worli', 'Chain pharmacy.'),
  -- ATMs
  ('HDFC Bank ATM', 'money', 18.93001, 72.82653, 'Churchgate', 'ATM on Dinshaw Wachha Road.'),
  ('Axis Bank ATM', 'money', 18.93018, 72.82723, 'Churchgate', 'ATM near Churchgate station.'),
  ('ICICI Bank ATM', 'money', 18.92418, 72.83279, 'Colaba', 'ATM on Battery Street, near the Gateway.'),
  ('Axis Bank ATM Colaba', 'money', 18.92465, 72.83297, 'Colaba', 'ATM on Shivaji Maharaj Marg, by Regal Cinema.'),
  ('SBI ATM', 'money', 18.93287, 72.83278, 'Kala Ghoda, Fort', 'State Bank ATM in Kala Ghoda.'),
  ('Axis Bank ATM Lower Parel', 'money', 19.00980, 72.83130, 'Lower Parel', 'ATM on Gokhale Road.'),
  -- SIM
  ('Vi store (Vodafone Idea)', 'sim', 18.93336, 72.82694, 'Churchgate', 'Vi SIMs and top-ups. Bring your passport and a photo.'),
  -- Laundry
  ('Beauty Art Dyers & Cleaners', 'laundry', 18.93311, 72.82563, 'Churchgate', 'Dry cleaning on Veer Nariman Road.'),
  -- Coworking
  ('Awfis Lower Parel', 'cowork', 19.00055, 72.83003, 'Lower Parel', 'Coworking; day passes, book ahead.'),
  ('WeWork Worli', 'cowork', 19.01195, 72.82136, 'Worli', 'Coworking on Annie Besant Road; day passes, book ahead.')
) AS v(name, category, lat, lng, area, tip)
WHERE NOT EXISTS (SELECT 1 FROM community_places p WHERE p.name = v.name AND abs(p.lat - v.lat) < 0.002);
