-- Weekly metrics review: last 7 days vs the 7 days before.
-- Run from the repo root with the stack up (PowerShell):
--   Get-Content metrics\weekly_metrics.sql | docker compose exec -T db psql -U postgres -d food_marketplace --csv -f - | Out-File -Encoding utf8 metrics\weekly_metrics.csv
WITH p AS (
  SELECT 'this_week' AS period, now() - interval '7 days' AS s, now() AS e
  UNION ALL
  SELECT 'last_week', now() - interval '14 days', now() - interval '7 days'
),
o AS (
  SELECT p.period, o.*
  FROM p JOIN orders o ON o.created_at >= p.s AND o.created_at < p.e
),
m AS (
  SELECT p.period,
    (SELECT count(*) FROM o WHERE o.period = p.period AND o.status = 'completed')            AS completed_orders_north_star,
    (SELECT count(*) FROM o WHERE o.period = p.period)                                        AS orders_placed,
    (SELECT round(100.0 * count(*) FILTER (WHERE status = 'cancelled') / NULLIF(count(*),0), 1)
       FROM o WHERE o.period = p.period)                                                      AS cancel_rate_pct,
    (SELECT coalesce(sum(total),0) FROM o WHERE o.period = p.period AND o.status = 'completed') AS gmv_completed,
    (SELECT round(avg(total),2) FROM o WHERE o.period = p.period AND o.status = 'completed')   AS avg_order_value,
    (SELECT coalesce(sum(so.commission_amount),0) FROM o JOIN store_orders so ON so.order_id = o.id
       WHERE o.period = p.period AND so.status = 'completed')                                 AS commission_revenue,
    (SELECT count(DISTINCT user_id) FROM o WHERE o.period = p.period)                         AS active_buyers,
    (SELECT count(DISTINCT o.user_id) FROM o WHERE o.period = p.period
       AND EXISTS (SELECT 1 FROM orders x WHERE x.user_id = o.user_id AND x.created_at < p.s)) AS repeat_buyers,
    (SELECT count(*) FROM users u WHERE u.role = 'customer' AND u.created_at >= p.s AND u.created_at < p.e) AS new_customer_signups,
    (SELECT count(DISTINCT o.user_id) FROM o JOIN users u ON u.id = o.user_id
       WHERE o.period = p.period AND u.created_at >= p.s)                                     AS new_signups_who_ordered,
    (SELECT count(*) FROM stores st WHERE st.created_at >= p.s AND st.created_at < p.e)       AS new_stores,
    (SELECT count(DISTINCT so.store_id) FROM o JOIN store_orders so ON so.order_id = o.id
       WHERE o.period = p.period)                                                             AS stores_with_orders,
    (SELECT count(*) FROM store_reviews r WHERE r.created_at >= p.s AND r.created_at < p.e)   AS store_reviews,
    (SELECT round(avg(rating),2) FROM store_reviews r WHERE r.created_at >= p.s AND r.created_at < p.e) AS avg_store_rating
  FROM p
)
SELECT * FROM m ORDER BY period DESC;
