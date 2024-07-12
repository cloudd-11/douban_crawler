import sqlite3
import requests
import os
from tqdm import tqdm
import time
import random

def download_image(record):
    cover_url = record[0]
    if cover_url:
        try:
            # 提取文件名
            file_name = cover_url.split('/')[-1]
            save_path = os.path.join('images', file_name)

            # 检查文件是否已存在
            if not os.path.exists(save_path):
                print(save_path)
                # 完整的请求头，包括User-Agent和Cookies
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Referer': 'https://movie.douban.com/',  # 添加Referer头
                    'Cookie': 'your_cookie_here'  # 可以从浏览器中复制一个有效的cookie
                }

                response = requests.get(cover_url, headers=headers, stream=True)
                response.raise_for_status()

                with open(save_path, 'wb') as file:
                    for chunk in response.iter_content(1024):
                        file.write(chunk)
                time.sleep(random.uniform(0.5, 1.5))  # 随机化请求间隔
        except requests.RequestException as e:
            print(f"Failed to download {cover_url}: {e}")

def fetch_and_download_images():
    # 连接数据库
    conn = sqlite3.connect('movies.db')
    c = conn.cursor()
    
    # 获取所有电影的 cover_url
    c.execute('SELECT cover_url FROM movies')
    records = c.fetchall()
    
    # 创建存储图片的目录
    if not os.path.exists('images'):
        os.makedirs('images')

    # 使用tqdm显示进度条，并逐个下载图片
    for record in tqdm(records, desc="Downloading images"):
        download_image(record)

    # 关闭数据库连接
    conn.close()

if __name__ == "__main__":
    fetch_and_download_images()
