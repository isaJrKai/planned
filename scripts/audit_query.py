import sqlite3, json
conn = sqlite3.connect('/home/z/my-project/db/custom.db')
conn.row_factory = sqlite3.Row
rows = conn.execute('SELECT id, childId, userId, event, properties, ipAddress, userAgent, createdAt FROM AnalyticsEvent ORDER BY createdAt DESC LIMIT 50').fetchall()
result = [dict(r) for r in rows]
conn.close()
print(json.dumps(result))
