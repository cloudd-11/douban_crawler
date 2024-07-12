import sqlite3
import json  # 用于解码JSON字符串
import random

def get_movie_by_title(conn, title):
    c = conn.cursor()
    c.execute('SELECT * FROM movies WHERE title=?', (title,))
    records = c.fetchall()

    if records:
        record = random.choice(records)  # 随机选择一个匹配的记录
        print("\nMatched Record:")
        for i, col in enumerate(c.description):
            col_name = col[0]
            col_value = record[i]
            if col_name in ['rating', 'types', 'regions', 'actors']:
                # 解码JSON字符串
                col_value = json.loads(col_value)
            print(f"{col_name}: {col_value}")
    else:
        print(f"No match found for title: {title}")

def check_database():
    # 连接数据库
    conn = sqlite3.connect('movie-site/movie/db/movies.db')

    while True:
        try:
            title = input("Enter movie title: ")
            get_movie_by_title(conn, title)
        except KeyboardInterrupt:
            print("\nExiting...")
            break

    # 关闭数据库连接
    conn.close()

if __name__ == "__main__":
    check_database()