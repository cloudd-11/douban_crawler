import { join } from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// 异步函数打开数据库
async function openDB() {
  return open({
    filename: join(process.cwd(), 'db', 'movieonly.db'),
    driver: sqlite3.Database
  });
}

// 安全解析 JSON 的函数
function safeJSONParse(value) {
  try {
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('JSON.parse failed:', error);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' && req.query.q) {
    const query = req.query.q.toLowerCase().replace(/·/g, ''); // 移除查询字符串中的 `·` 符号

    try {
      const db = await openDB();
      const rows = await db.all('SELECT * FROM movies');

      const processMovie = (movie) => ({
        ...movie,
        types: safeJSONParse(movie.types),
        regions: safeJSONParse(movie.regions),
        actors: safeJSONParse(movie.actors),
        writers: safeJSONParse(movie.writers),
        directors: safeJSONParse(movie.directors),
        title: movie.title.replace(/·/g, '')
      });

      const processedMovies = rows.map(processMovie);

      // 所有电影的平均评分 (C)
      const C = processedMovies.reduce((acc, movie) => acc + parseFloat(movie.score), 0) / processedMovies.length;
      
      // 评分人数阈值 (m)
      const m = 100000; // 根据数据集情况调整阈值

      // 计算加权评分
      const calculateWeightedRating = (movie) => {
        const R = parseFloat(movie.score);
        const v = movie.vote_count; // 使用 vote_count 表示评分人数
        return (v / (v + m)) * R + (m / (v + m)) * C;
      };

      // 移除演员和电影名字中的 `·` 符号用于比较
      const removeDot = (str) => str.replace(/·/g, '');

      // 过滤匹配的电影，仅限电影名和演员名严格包含搜索字符串
      const filteredMovies = processedMovies.filter(movie => {
        const titleMatch = movie.title.toLowerCase().includes(query);
        const actorsMatch = movie.actors.some(actor => removeDot(actor).toLowerCase().includes(query));
        return titleMatch || actorsMatch;
      });

      // 按 weighted rating 降序排序
      filteredMovies.sort((a, b) => calculateWeightedRating(b) - calculateWeightedRating(a));

      // 输出调试信息
      console.log('Query:', query);
      console.log('Filtered Movies:', filteredMovies);

      return res.status(200).json(filteredMovies);
    } catch (error) {
      console.error('Query Error:', error);
      return res.status(500).json({ error: 'Failed to query the database or process data' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid request' });
  }
}