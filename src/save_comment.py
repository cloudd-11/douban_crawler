import sqlite3
import json
import os

# 数据库路径
db_path = 'movie-site/movie/db/movies.db'
# JSON文件路径
json_path = 'movie_comments.json'

# 打开SQLite3数据库
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 读入JSON文件
with open(json_path, 'r', encoding='utf-8') as f:
    comments = json.load(f)

# 按movie_id归类评论
classified_comments = {}
for comment in comments:
    movie_id = comment.pop("movie_id")  # 移除movie_id列
    if movie_id not in classified_comments:
        classified_comments[movie_id] = []
    classified_comments[movie_id].append(comment)

# 查看数据库是否存在comments列
cursor.execute("PRAGMA table_info(movies)")
columns = [info[1] for info in cursor.fetchall()]
if 'comments' not in columns:
    cursor.execute("ALTER TABLE movies ADD COLUMN comments TEXT")
    conn.commit()

# 更新数据库中的评论字段
for movie_id, movie_comments in classified_comments.items():
    cursor.execute(
        "UPDATE movies SET comments = ? WHERE id = ?",
        (json.dumps(movie_comments, ensure_ascii=False), movie_id)
    )

# 提交修改并关闭数据库连接
conn.commit()
conn.close()

print("Comments have been successfully updated in the database.")