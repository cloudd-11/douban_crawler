import sqlite3
import jieba
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import os
import re
from tqdm import tqdm
import json  # 用于处理comments列的json字符串
from concurrent.futures import ThreadPoolExecutor

# 读取停用词文件
stopwords_path = 'stopwords.txt'
with open(stopwords_path, 'r', encoding='utf-8') as f:
    stopwords = set([line.strip() for line in f.readlines()])

# 连接到数据库
db_path = 'movie-site/movie/db/movies.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 查询所有电影的id和对应评论内容
cursor.execute("SELECT id, comments FROM movies")
movies = cursor.fetchall()
print(f"Total movies: {len(movies)}")

# 创建保存词云图的目录
output_dir = 'movie-site/movie/public/wordclouds/'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 创建一个字典来存储每个电影的评论文本
movie_comments = {}
non_none_comments_count = 0  # 统计comments列不为None的电影数量

# 整理评论到对应的电影id下
for movie in movies:
    movie_id, comments = movie
    if comments is not None:
        non_none_comments_count += 1
        try:
            comments_list = json.loads(comments)  # 将评论列的json字符串转换为列表
            for comment in comments_list:
                content = comment.get("content", "")
                if isinstance(content, str):
                    # 解码 Unicode 转义字符
                    content = content
                    #content = content.encode('utf-8').decode('unicode_escape')
                elif isinstance(content, bytes):
                    # 如果直接是 bytes 类型，尝试解码为 utf-8
                    content = content.decode('utf-8')
                if movie_id in movie_comments:
                    movie_comments[movie_id] += ' ' + content
                else:
                    movie_comments[movie_id] = content
        except (json.JSONDecodeError, UnicodeEncodeError) as e:
            print(f"Error processing comments for movie_id {movie_id}: {e}")

# 添加过滤特殊字符的函数
def filter_non_chinese(text):
    return re.sub(r'[^\u4e00-\u9fa5]+', ' ', text)

# 汇报comments列不为None的电影数量
print(f"Movies with non-none comments: {non_none_comments_count}")

# 为每个电影生成词云并保存
for movie_id, texts in tqdm(movie_comments.items(), desc="Generating wordclouds"):
    output_file = os.path.join(output_dir, f'{movie_id}.jpg')
    if os.path.exists(output_file):
        print(f"Wordcloud for movie_id {movie_id} already exists.")
        continue
    # 分词并过滤非中文字符
    try:
        text_filtered = filter_non_chinese(texts)
        wordlist = jieba.cut(text_filtered, cut_all=False)

        words_filtered = [word for word in wordlist if word not in stopwords]
        txt = ' '.join(words_filtered)
        
        # 生成词云
        wordcloud = WordCloud(
            font_path='./movie-site/movie/public/fonts/华文中宋.ttf',  # 指定中文字体路径
            background_color='#111111',  # 更深的灰色背景
            width=1600,  # 提高宽度
            height=800,  # 提高高度
            margin=2  # 调整词云图的边缘大小
        ).generate(txt)
        
        # 绘制并保存词云图（减少边框）
        fig, ax = plt.subplots()
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')  # 取消坐标轴
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)  # 去掉边框
        output_file = os.path.join(output_dir, f'{movie_id}.jpg')
        plt.savefig(output_file, bbox_inches='tight', pad_inches=0)  # 减少边距
        plt.close()
    except Exception as e:
        print(f'Error generating wordcloud for movie_id {movie_id}: {e}')

# 关闭数据库连接
conn.close()

print("词云图生成完毕。")