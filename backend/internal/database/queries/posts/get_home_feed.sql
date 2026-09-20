-- name: GetHomeFeed :many
WITH feed_posts AS (
	SELECT *
	FROM posts
	WHERE (
		$2::timestamptz IS NULL
		OR created_at < $2::timestamptz
		OR (created_at = $2::timestamptz AND id < $3)
	)
	ORDER BY created_at DESC, id DESC
	LIMIT $1
),
comment_counts AS (
	SELECT c.post_id, COUNT(*)::int AS comment_count
	FROM comments c
	JOIN feed_posts fp ON fp.id = c.post_id
	GROUP BY c.post_id
),
like_counts AS (
	SELECT pl.post_id, COUNT(*)::int AS like_count
	FROM post_likes pl
	JOIN feed_posts fp ON fp.id = pl.post_id
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
	COALESCE(
		(SELECT json_agg(json_build_object('url', pm.url, 'type', pm.type, 'display_order', pm.display_order)
			ORDER BY pm.display_order)
		 FROM post_media pm
		 WHERE pm.post_id = p.id),
		'[]'::json
	) AS media
FROM feed_posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.id
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN comment_counts ON comment_counts.post_id = p.id
LEFT JOIN like_counts ON like_counts.post_id = p.id
ORDER BY p.created_at DESC, p.id DESC
