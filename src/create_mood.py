import sqlite3
import json
from tqdm import tqdm
from transformers import BertTokenizer, BertForSequenceClassification
import torch
import torch.nn.functional as F

# 检查是否有可用的 GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 加载预训练的模型和分词器
model_name = "uer/roberta-base-finetuned-jd-binary-chinese"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name)

# 将模型移动到 GPU 上
model.to(device)

def predict_sentiment(sentence):
    # 对输入句子进行分词和编码
    inputs = tokenizer(sentence, return_tensors="pt", truncation=True, padding=True)
    
    # 将输入数据移动到 GPU 上
    inputs = {key: value.to(device) for key, value in inputs.items()}
    
    # 获取模型的输出
    with torch.no_grad():  # 不计算梯度以节省内存
        outputs = model(**inputs)
    
    # 获取逻辑斯特输出并计算概率
    probs = F.softmax(outputs.logits, dim=-1)
    
    # 假设标签 1 是积极，标签 0 是消极
    positive_probability = probs[0][1].item()
    
    return positive_probability

def update_database(db_path):
    # 连接到 SQLite 数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 获取所有电影记录
    cursor.execute("SELECT id, comments FROM movies")
    rows = cursor.fetchall()

    # 使用 tqdm 显示处理进度
    for row in tqdm(rows, desc="Processing movies", unit="movies"):
        movie_id, comments_json = row
        if comments_json is None:
            continue
        comments = json.loads(comments_json)

        # 对每条评论计算积极概率并使用 tqdm 显示进度
        for comment in tqdm(comments, desc=f"Processing comments for movies {movie_id}", leave=False, unit="comment"):
            content = comment["content"][:512]
            # print(content)
            positive_rate = predict_sentiment(content)
            comment["positive_rate"] = positive_rate

        # 更新数据库中的评论数据
        updated_comments_json = json.dumps(comments, ensure_ascii=False)
        cursor.execute("UPDATE movies SET comments = ? WHERE id = ?", (updated_comments_json, movie_id))

    # 提交更改并关闭连接
    conn.commit()
    conn.close()

if __name__ == "__main__":
    db_path = "movie-site/movie/db/movies.db"
    update_database(db_path)
    print("Database updated successfully.")