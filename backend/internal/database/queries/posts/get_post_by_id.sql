SELECT
	p.id AS post_id,
	p.type AS post_type,
	p.content,
	p.created_at,
	u.id AS author_id,
	u.name AS author_name,
	r.rating,
	r.location_id,
	l.name AS location_name,
	COALESCE(
		(SELECT json_agg(json_build_object('url', pm.url, 'type', pm.type))
		 FROM post_media pm
		 WHERE pm.post_id = p.id),
		'[]'::json
	) AS media
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.id
LEFT JOIN locations l ON r.location_id = l.id
WHERE p.id = $1
