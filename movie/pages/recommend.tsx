import React, { useState , useRef, useEffect} from 'react';
import { message, Pagination, ConfigProvider, Select } from 'antd';
import { useRouter } from 'next/router'; // 引入 useRouter 以便路由跳转
import Head from 'next/head';
import Navbar from '../components/Navbar';
import styles from '../styles/Search.module.css';

const { Option } = Select;

const types = ['全部', '剧情', '喜剧', '爱情', '动作', '惊悚', '犯罪', '短片', '动画', '恐怖', '冒险', '悬疑', '奇幻', '纪录', '科幻', '家庭', '传记', '历史', '战争', '音乐', '歌舞', '武侠', '儿童', '灾难'];

const Recommend: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>();
  const [movies, setMovies] = useState([] as any[]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const moviesListRef = useRef<HTMLDivElement>(null);
  let hasFetched = useRef(false);
  const router = useRouter(); // 初始化路由

  // 加载缓存数据
  useEffect(() => {
    const currentMovies = localStorage.getItem('currentMovies');
    const currentType = localStorage.getItem('currentType') as any;
    
    if (currentMovies) {
      console.log(currentMovies);
      setMovies(JSON.parse(currentMovies));
      setSelectedType(currentType);
      
      handleTypeChange(currentType, false, false);
    } else {
      const cachedMovies = localStorage.getItem('cachedMovies');
      if (cachedMovies) {
        setMovies(JSON.parse(cachedMovies));
      }
    }
  }, []);



  // 加载时触发查询
  useEffect(() => {
    const currentMovies = localStorage.getItem('currentMovies');
    if (!hasFetched.current && !currentMovies) {
      handleTypeChange('全部',false,true);
      hasFetched.current = true; // 标志为 true
    }
  }, []);

  const handleTypeChange = async (value: string, show: boolean, renew: boolean) => {
    setSelectedType(value);
    setLoading(true);
    const startTime = Date.now(); // 记录搜索开始时间

    try {
      const response = await fetch(`/api/searchMoviesByType?type=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        setMovies(data);
        const startIndex = (Number(localStorage.getItem('currentPage')) - 1) * pageSize;
        const currentMovies = data.slice(startIndex, startIndex + pageSize);
        localStorage.setItem('currentMovies', JSON.stringify(currentMovies));
        localStorage.setItem('currentType', value);
        if (value === '全部') {
            // 缓存前20个电影数据
          localStorage.setItem('cachedMovies', JSON.stringify(data.slice(0, 20)));
        }
        const endTime = Date.now(); // 记录搜索结束时间
        const duration = (endTime - startTime) / 1000; // 搜索耗时 (秒)
        if (show) {
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
      if (!renew) {
        const currentPage = localStorage.getItem('currentPage') as any;
        setCurrentPage(Number(currentPage));
      } else {
        setCurrentPage(1);
        localStorage.setItem('currentPage', JSON.stringify(1));
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
        <title>Recommend Movies</title>
        <meta name="description" content="Recommend movies by type" />
      </Head>
      <Navbar />
      <header className={styles.searchSection}>
        <div className={styles.newContainer}>
        <ConfigProvider
            theme={{
              components: {
                Select: {
                  colorPrimary: '#fff', // 白色字体
                  colorPrimaryHover: '#fff', // 悬停时白色字体
                  colorText: '#fff',
                  colorBgContainer: '#36242A',
                  colorBgElevated: '#36242A',
                  optionSelectedBg: '#36242A',
                  colorTextPlaceholder: '#fff',
                  colorSplit: '#eee',
                  colorBorder: '#eee',
                  
                },
              },
            }}
          >
          <Select
            placeholder="类型..."
            value={selectedType}
            onChange={(value)=>handleTypeChange(value,true,true)}
            className={styles.selectNoBorder}
            loading={loading}
              dropdownMatchSelectWidth={false}
              virtual={false}
              popupClassName={styles.select}
              listHeight={768}
          >
            {types.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
            </Select>
            
          </ConfigProvider>
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
            />
          </ConfigProvider>
        )}
      </header>
    </div>
  );
};

export default Recommend;