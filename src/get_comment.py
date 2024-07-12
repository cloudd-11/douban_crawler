import sqlite3
import requests
from bs4 import BeautifulSoup
import re
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import random
import time as thetime

def get_movie_data():
    db_path = 'movie-site/movie/db/movies.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, url FROM movies')
    movies = [{'id': row[0], 'url': row[1]} for row in cursor.fetchall()]
    conn.close()
    return movies

def extract_score(score_class):
    match = re.search(r'allstar(\d{2})', score_class)
    if match:
        return int(match.group(1)) // 10
    return None

def fetch_and_store_comments(movie):
    movie_id, movie_url = movie['id'], movie['url']
    comments_url = f"{movie_url}comments?percent_type=&start=0&limit=600&status=P&sort=new_score&comments_only=1"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
    response = requests.get(comments_url, headers=headers)
    if response.status_code == 418:
        print("error")
    thetime.sleep(random.uniform(1, 3))  # Random sleep to prevent being blocked
    soup = BeautifulSoup(response.text.replace(r'\"', '"').replace(r'\n', ''), 'html.parser')
    
    comments_data = []
    for comment_div in soup.select('.comment-item'):
        try:
            username = comment_div.select_one('.comment-info a').text.strip()
            content = comment_div.select_one('.comment-content .short').text.strip()
            time = comment_div.select_one('.comment-time').text.strip()
            score = extract_score(comment_div.select_one('.comment-info .rating')['class'][0])
            like_num = int(comment_div.select_one('.comment-vote .votes').text.strip())
            comments_data.append({
                'movie_id': movie_id,
                'username': username.encode('utf-8').decode('unicode-escape'),
                'content': content.encode('utf-8').decode('unicode-escape'),
                'time': time,
                'score': score,
                'like_num': like_num
            })
        except Exception as e:
            ab = 1
            # print(f"Failed to process comment for movie_id {movie_id}: {e}")
            
    return comments_data

# 主程序
movies = get_movie_data()
all_comments = []

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(fetch_and_store_comments, movie): movie for movie in movies}
    for future in tqdm(as_completed(futures), total=len(futures), desc="Fetching comments"):
        try:
            comments = future.result()
            all_comments.extend(comments)
        except Exception as e:
            print(f"An error occurred: {e}")

# 将所有评论数据保存到一个JSON文件
with open('new_movie_comments.json', 'w', encoding='utf-8', errors='ignore') as f:
    json.dump(all_comments, f, ensure_ascii=False, indent=4)

print("Comments scraping and saving completed.")