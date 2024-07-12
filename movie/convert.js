const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'db', 'movies.db');
const db = new Database(dbPath);

// 处理字段转换和解码函数
const decodeStr = (str) => JSON.stringify(str).replace(/\\u[\dA-F]{4}/gi,
  (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))).slice(1, -1); // 注意：JSON.stringify返回字符串，包括前后引号，需要去掉

// 读取所有电影数据
const stmt = db.prepare(`SELECT * FROM movies`);
const movies = stmt.all();

movies.forEach((movie) => {
  const { id } = movie;
  const updatedMovie = {
    ...movie,
    types: JSON.stringify(JSON.parse(movie.types).map(decodeStr)),
    regions: JSON.stringify(JSON.parse(movie.regions).map(decodeStr)),
    actors: JSON.stringify(JSON.parse(movie.actors).map(decodeStr)),
    rating: JSON.stringify(JSON.parse(movie.rating).map(decodeStr))
  };

  // 更新数据库中的电影数据
  const updateStmt = db.prepare(`
    UPDATE movies
    SET
      types = @types,
      regions = @regions,
      actors = @actors,
      rating = @rating
    WHERE id = @id
  `);
  updateStmt.run(updatedMovie);
  console.log(`Updated movie with id ${id}`);
});

console.log('Encoding conversion completed.');
db.close();