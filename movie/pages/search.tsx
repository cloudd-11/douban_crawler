import React, { useState , useRef, useEffect } from 'react';
import { message, Pagination, ConfigProvider } from 'antd';
import { useRouter } from 'next/router'; // 引入 useRouter 以便路由跳转
import Head from 'next/head';
import Navbar from '../components/Navbar';
import styles from '../styles/Search.module.css';


const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([] as any[]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const moviesListRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // 初始化路由

  // 加载缓存数据
  useEffect(() => {
    const currentMovies = localStorage.getItem('currentMovies');
    const currentType = localStorage.getItem('currentType') as any;
    if (currentMovies) {
      console.log(currentMovies);
      setMovies(JSON.parse(currentMovies));
      setQuery(currentType);
      
      handleSearch(false,false);
    }
  }, []);

  const handleSearch = async (renew: boolean, press:boolean) => {
    const currentType = localStorage.getItem('currentType') as any;
    let myquery = '';
    if (currentType && !press) {
      setQuery(currentType);
      myquery = currentType;
    } else {
      myquery = query;
    }
    if (!myquery.trim()) {
      message.warning('Please enter text');
      return; // 禁止空搜索，直接返回
    }

    setLoading(true);
    const startTime = Date.now(); // 记录搜索开始时间

    try {
      const response = await fetch(`/api/searchMovies?q=${encodeURIComponent(myquery)}`);
      if (response.ok) {
        const data = await response.json();
        setMovies(data);
        const startIndex = (Number(localStorage.getItem('currentPage')) - 1) * pageSize;
        const currentMovies = data.slice(startIndex, startIndex + pageSize);
        localStorage.setItem('currentMovies', JSON.stringify(currentMovies));
        localStorage.setItem('currentType', myquery);
        const endTime = Date.now(); // 记录搜索结束时间
        const duration = (endTime - startTime) / 1000; // 搜索耗时 (秒)
        if (press) {
          message.success(`Found ${data.length} results in ${duration.toFixed(2)} seconds`);
        }
        
      } else {
        console.error('Failed to fetch movies:', response.statusText);
        message.error('Failed to fetch movies');
      }
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      message.error('Failed to fetch movies');
    } finally {
      setLoading(false);
      if (renew) {
        setCurrentPage(1); // 搜索后回到第一页
        localStorage.setItem('currentPage', JSON.stringify(1));
      } else {
        const currentPage = localStorage.getItem('currentPage') as any;
        setCurrentPage(Number(currentPage));
      }
      
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * pageSize;
    const currentMovies = movies.slice(startIndex, startIndex + pageSize);
    localStorage.setItem('currentMovies', JSON.stringify(currentMovies));
    localStorage.setItem('currentPage', JSON.stringify(page));
      if (moviesListRef.current) {
        moviesListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  // 当前页显示的电影
  const startIndex = (currentPage - 1) * pageSize;
  const currentMovies = movies.slice(startIndex, startIndex + pageSize);

  return (
    <div className={styles.container}>
      <Head>
        <title>Search Movies</title>
        <meta name="description" content="Search for movies" />
      </Head>
      <Navbar />
      <header className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search for movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(true,true);  }}
            className={styles.searchInput}
          />
          <button onClick={()=>handleSearch(true,true)} className={styles.searchButton} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <div ref={moviesListRef} className={`${styles.moviesList} ${movies.length > 0 ? styles.visible : ''}`}>
          {currentMovies.map((movie) => {
            const coverImagePath = `/images/${movie.cover_url.split('/').pop()}`;
            return (
              <div key={movie.id} className={styles.movieItem} onClick={() => { router.push(`/movie-details/${movie.id}`); console.log('clicked'); }}>
                <img src={coverImagePath} alt={`${movie.title} cover`} className={styles.coverImage} />
                <div className={styles.movieInfo}>
                  <h2 className={styles.movieTitle}>{movie.title}</h2>
                  <p><strong>Rating:</strong> {movie.score}</p>
                  <p><strong>Types:</strong> {movie.types.join(', ')}</p>
                  <p><strong>Regions:</strong> {movie.regions.join(', ')}</p>
                  <p><strong>Release Date:</strong> {movie.release_date}</p>
                  <p><strong>Score:</strong> {movie.score}</p>
                  <p><strong>Actors:</strong> {movie.actors.slice(0, 6).join(', ')}</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* 添加分页组件 */}
              {movies.length > 0 && (
                 <ConfigProvider
                 theme={{
                   components: {
                     Pagination: {
                           colorPrimary: '#eee', // 白色字体
                           colorPrimaryHover: '#fff', // 悬停时白色字体
                           colorText: '#ddd',
                           colorBgContainer: '#36242A',
                           //colorBgTextHover: '#444'
                     },
                   },
                 }}
               >
          <Pagination
            className={styles.pagination}
            current={currentPage}
            pageSize={pageSize}
            total={movies.length}
            onChange={handlePageChange}
            showSizeChanger={false} // 可选：禁用改变每页显示数量的功能
            showQuickJumper // 可选：启用快速跳转功能
          /></ConfigProvider>
        )}
      </header>
    </div>
  );
};

export default Search;