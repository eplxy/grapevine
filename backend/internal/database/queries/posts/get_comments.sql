WITH selected_post AS (
	SELECT id
	FROM posts
	WHERE id = $1
)
SELECT
	c.id,
	c.created_at,
	c.post_id,
	c.user_id,
	u.name AS author_name,
	c.content,
	c.parent_id
FROM comments c
JOIN selected_post p ON p.id = c.post_id
JOIN users u ON u.id = c.user_id
WHERE (
	$2::timestamptz IS NULL
	OR c.created_at < $2::timestamptz
	OR (c.created_at = $2::timestamptz AND c.id < $3)
)
ORDER BY c.created_at DESC, c.id DESC
LIMIT $4
