-- Food, cafés and errands in South Mumbai (Colaba, Fort, Churchgate, Lower
-- Parel), for side events in the south. Pins are from OpenStreetMap; tips are
-- drafts. They go in as "Waiting", so an admin checks each one (still open,
-- right spot, worth it) in Admin → Places before it shows on the map.
-- Run once in the SQL Editor. Running it again skips places already added.

INSERT INTO community_places (name, category, lat, lng, area, tip, price, added_by_name, owner_id, status)
SELECT v.name, v.category, v.lat, v.lng, v.area, v.tip, v.price, 'Mumbai Onchain team', 'ac29f408-0231-4419-a157-462c5f637a0c', 'pending'
FROM (VALUES
  -- Food
  ('Leopold Cafe', 'food', 18.92271, 72.83176, 'Colaba Causeway', 'Colaba’s old favourite: beer, big plates and a crowd every night.', '₹₹'),
  ('Britannia & Co.', 'food', 18.93447, 72.84036, 'Ballard Estate, Fort', 'Parsi classic for berry pulao and caramel custard. Lunch only, closed Sundays.', '₹₹'),
  ('Trishna', 'food', 18.92866, 72.83239, 'Kala Ghoda, Fort', 'Seafood institution, famous for butter garlic crab. Book ahead.', '₹₹₹'),
  ('Mahesh Lunch Home', 'food', 18.93403, 72.83361, 'Fort', 'Mangalorean seafood: fish fry, gassi and neer dosa.', '₹₹'),
  ('Ideal Corner', 'food', 18.93496, 72.83422, 'Fort', 'Small Parsi lunch spot; try the dhansak.', '₹'),
  ('Stadium Restaurant', 'food', 18.93336, 72.82686, 'Churchgate', 'Old Irani café across from Churchgate station. Quick and cheap.', '₹'),
  ('K. Rustom & Co.', 'food', 18.93318, 72.82499, 'Churchgate', 'Ice cream sandwiches, a South Bombay ritual.', '₹'),
  ('Pizza By The Bay', 'food', 18.93329, 72.82388, 'Marine Drive', 'Pizza with a sea view at the start of Marine Drive. Open late.', '₹₹'),
  ('The Bombay Canteen', 'food', 19.00323, 72.82758, 'Kamala Mills, Lower Parel', 'Modern Indian with a seasonal menu. Book for dinner.', '₹₹₹'),
  -- Cafés
  ('Kyani & Co.', 'cafe', 18.94379, 72.82892, 'Dhobi Talao', 'Irani café: bun maska, chai and kheema pav.', '₹'),
  ('Theobroma', 'cafe', 18.91922, 72.82923, 'Colaba', 'Brownies and coffee at the bakery’s Colaba branch.', '₹₹'),
  ('Subko Mini at Abode Bombay', 'cafe', 18.92374, 72.83271, 'Colaba', 'Specialty coffee and bakes, near the Gateway.', '₹₹'),
  ('Koinonia Coffee Roasters', 'cafe', 18.96564, 72.80686, 'Breach Candy', 'Specialty coffee roasters; a calm place to work for an hour.', '₹₹')
) AS v(name, category, lat, lng, area, tip, price)
WHERE NOT EXISTS (SELECT 1 FROM community_places p WHERE p.name = v.name AND abs(p.lat - v.lat) < 0.002);
