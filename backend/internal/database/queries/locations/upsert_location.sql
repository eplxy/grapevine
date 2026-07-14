INSERT INTO locations (google_place_id, name, address, location_type, lat, lng)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (google_place_id)
DO UPDATE SET
	name = EXCLUDED.name,
	address = EXCLUDED.address,
	location_type = EXCLUDED.location_type,
	lat = EXCLUDED.lat,
	lng = EXCLUDED.lng
RETURNING id
