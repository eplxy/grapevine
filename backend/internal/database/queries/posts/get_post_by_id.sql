WITH selected_post AS (
	SELECT *
	FROM posts
	WHERE id = $1
),
comment_counts AS (
	SELECT c.post_id, COUNT(*)::int AS comment_count
	FROM comments c
	JOIN selected_post sp ON sp.id = c.post_id
	GROUP BY c.post_id
),
like_counts AS (
	SELECT pl.post_id, COUNT(*)::int AS like_count
	FROM post_likes pl
	JOIN selected_post sp ON sp.id = pl.post_id
	GROUP BY pl.post_id
)
SELECT
	p.id AS post_id,
	p.type AS post_type,
	p.content,
	p.text_content,
	p.created_at,
	u.id AS author_id,
	u.name AS author_name,
	r.rating,
	r.location_id,
	l.name AS location_name,
	l.address AS location_address,
	COALESCE(comment_counts.comment_count, 0) AS comment_count,
	COALESCE(like_counts.like_count, 0) AS like_count,
	EXISTS(
		SELECT 1
		FROM post_likes pl
		WHERE pl.post_id = p.id AND pl.user_id = $2
	) AS is_liked_by_me,
	COALESCE(
		(SELECT json_agg(json_build_object('url', pm.url, 'type', pm.type, 'display_order', pm.display_order))
		 FROM post_media pm
		 WHERE pm.post_id = p.id),
		'[]'::json
	) AS media
FROM selected_post p
JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.id
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN comment_counts ON comment_counts.post_id = p.id
LEFT JOIN like_counts ON like_counts.post_id = p.id
