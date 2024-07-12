import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// 打开数据库连接
async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'db/movies.db'),
    driver: sqlite3.Database,
  });
}

export default async function getMovieDetails(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = await openDb();
  try {
    const movie = await db.get(
      `SELECT * FROM movies WHERE id = ?`,
      [id]
    );
    console.log(movie);
    // 如果 movie 对象包含 director, writer, languages 这几列不存在
    const defaultEmptyArray = [];
    movie.director = movie.director ? JSON.parse(movie.director) : defaultEmptyArray;
    movie.writer = movie.writer ? JSON.parse(movie.writer) : defaultEmptyArray;
    movie.languages = movie.languages ? JSON.parse(movie.languages) : defaultEmptyArray;
    movie.introduction = movie.introduction || '';
    movie.run = movie.run || 0;

    db.close();

    res.json(movie);
  } catch (error) {
    console.error("Error fetching movie data:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}