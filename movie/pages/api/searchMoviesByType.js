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
  if (req.method === 'GET') {
    const typeQuery = req.query.type ? req.query.type.toLowerCase() : null;

    try {
      const db = await openDB();
      const rows = await db.all('SELECT * FROM movies');

      const processMovie = (movie) => ({
        ...movie,
        types: safeJSONParse(movie.types),
        regions: safeJSONParse(movie.regions),
        actors: safeJSONParse(movie.actors),
        writers: safeJSONParse(movie.writers),
        directors: safeJSONParse(movie.directors)
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

      let filteredMovies;

      // 如果 typeQuery 是 "all" 或 "全部"，返回所有电影
      if (!typeQuery || typeQuery === 'all' || typeQuery === '全部') {
        filteredMovies = processedMovies;
      } else {
        // 否则，按照类型过滤电影
        filteredMovies = processedMovies.filter(movie => 
          movie.types.some(type => type.toLowerCase().includes(typeQuery))
        );
      }

      // 按 weighted rating 降序排序
      filteredMovies.sort((a, b) => calculateWeightedRating(b) - calculateWeightedRating(a));

      // 输出调试信息
      console.log('Type Query:', typeQuery);
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