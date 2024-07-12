import requests
import sqlite3
import json
import time
import threading
from queue import Queue
from tqdm import tqdm
import concurrent.futures

# 请求头信息，模拟浏览器访问
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
}

# 队列用于存放电影数据
movie_queue = Queue()

def fetch_total_count(url, headers):
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('total', 0)
    except (requests.exceptions.RequestException, ValueError):
        print(f"Failed to fetch total count from {url}")
        return 0

def insert_movie(c, movie):
    movie_id = movie['id']
    
    # 检查是否已有该ID
    c.execute('SELECT COUNT(*) FROM movies WHERE id=?', (movie_id,))
    if c.fetchone()[0] > 0:
        return
    
    # 删除rank字段
    if 'rank' in movie:
        del movie['rank']

    # 插入数据
    c.execute('''
        INSERT INTO movies (id, rating, cover_url, is_playable, types, regions, title, 
                            url, release_date, actor_count, vote_count, score, actors,
                            is_watched)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (movie['id'], json.dumps(movie['rating']), movie['cover_url'], movie['is_playable'], 
          json.dumps(movie['types']), json.dumps(movie['regions']), movie['title'], movie['url'], 
          movie['release_date'], movie['actor_count'], movie['vote_count'], movie['score'], 
          json.dumps(movie['actors']), movie['is_watched']))
    
    c.connection.commit()

def fetch_movies_data(interval_id, t, headers):
    count_url = f'https://movie.douban.com/j/chart/top_list_count?type={t}&interval_id={interval_id}&action='
    total = fetch_total_count(count_url, headers)
    if total == 0:
        return

    print(f"Processing type {t}, interval {interval_id}, total count {total}")
    base_url = f'https://movie.douban.com/j/chart/top_list?type={t}&interval_id={interval_id}&action='
    
    start = 0
    limit = 20

    with tqdm(total=total, desc=f"Type {t}, Interval {interval_id}") as pbar:
        while start < total:
            url = f'{base_url}&start={start}&limit={limit}'
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                movies = response.json()

                for movie in movies:
                    movie_queue.put(movie)
                
                start += limit
                pbar.update(len(movies))
                time.sleep(0.1)  # 避免请求过于频繁

            except (requests.exceptions.RequestException, ValueError) as e:
                print(f"Failed to fetch or process data: {e}")
                break

def database_writer():
    # 连接数据库
    conn = sqlite3.connect('movies.db')
    c = conn.cursor()

    # 创建表格
    c.execute('''
        CREATE TABLE IF NOT EXISTS movies (
            id TEXT PRIMARY KEY,
            rating TEXT,
            cover_url TEXT,
            is_playable BOOLEAN,
            types TEXT,
            regions TEXT,
            title TEXT,
            url TEXT,
            release_date TEXT,
            actor_count INTEGER,
            vote_count INTEGER,
            score TEXT,
            actors TEXT,
            is_watched BOOLEAN
        )
    ''')

    while True:
        movie = movie_queue.get()
        if movie is None:  # 终止信号
            movie_queue.task_done()
            break
        insert_movie(c, movie)
        movie_queue.task_done()
    
    # 关闭数据库连接
    conn.close()

def main():
    intervals = [(i, i - 10) for i in range(100, 0, -10)]
    types = [i for i in range(1, 32) if i not in [9, 21, 26]]
    
    # 数据库写线程
    writer_thread = threading.Thread(target=database_writer)
    writer_thread.start()

    # 网络请求线程池
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = []
        for t in types:
            for start_interval, end_interval in intervals:
                interval_id = f"{start_interval}%3A{end_interval}"
                futures.append(executor.submit(fetch_movies_data, interval_id, t, headers))
        
        for future in concurrent.futures.as_completed(futures):
            future.result()

    # 等待所有电影入队处理完成
    movie_queue.join()

    # 发送终止信号并等待写线程结束
    movie_queue.put(None)
    writer_thread.join()

    print("All movies have been processed.")

if __name__ == "__main__":
    main()