import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import styles from '../../styles/MovieDetails.module.css';
import { Card, List, Form, Input, Button, Typography, Avatar } from 'antd';

const { Title, Paragraph } = Typography;

function getStarRating(score: number): JSX.Element {
  // 确保分数在1到5之间
  const normalizedScore = Math.min(Math.max(score, 1), 5);

  // 生成实心星星
  const fullStars = Array.from({ length: normalizedScore }, (_, index) => (
    <span key={index}>★</span>
  ));

  // 生成空心星星
  const emptyStars = Array.from({ length: 5 - normalizedScore }, (_, index) => (
    <span key={index + normalizedScore}>☆</span>
  ));

  // 合并星星并返回
  return (
    <span>
      {fullStars.concat(emptyStars)}
      {` ${normalizedScore}/5`}
    </span>
  );
}


const MovieDetails: React.FC = () => {
  const [movie, setMovie] = useState<any>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetch(`/api/movie-details?id=${id}`)
        .then((response) => response.json())
        .then((data) => {
          const movieWithParsedFields = {
            ...data,
            actors: Array.isArray(data.actors) ? data.actors : JSON.parse(data.actors),
            directors: Array.isArray(data.directors) ? data.directors : JSON.parse(data.directors),
            regions: Array.isArray(data.regions) ? data.regions : JSON.parse(data.regions),
            types: Array.isArray(data.types) ? data.types : JSON.parse(data.types),
            writers: Array.isArray(data.writers) ? data.writers : JSON.parse(data.writers)
          };
          setMovie(movieWithParsedFields);
        })
        .catch((error) => {
          console.error('Error fetching movie data:', error);
        });
    }
  }, [id]);

  if (!movie) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Movie Details - Loading...</title>
          <meta name="description" content="Loading movie details..." />
        </Head>
        <Navbar />
        <div className={styles.movieDetails}>
          <div className={styles.leftPanel}>
            
          </div>
          <div className={styles.rightPanel}>
            
          </div>
        </div>
      </div>
    );
  }
  const comments = JSON.parse(movie.comments);
  const coverImagePath = `/images/${movie.cover_url.split('/').pop()}`;


  
  return (
    <div className={styles.container}>
      <Head>
        <title>{movie.title} - Movie Details</title>
        <meta name="description" content={`Details and reviews of ${movie.title}`} />
      </Head>
      <Navbar />
      <div className={styles.movieDetails}>
        <div className={styles.leftPanel}>
          <div className={styles.movieHeader}>
            <div className={styles.cover}>
              <img src={coverImagePath} alt={`${movie.title} cover`} />
            </div>
            <div className={styles.details}>
              <Title level={2} style={{ color: 'white' ,fontsize: '20px'}}>{movie.title}</Title>
              <p className="paragraph"><strong>Release Date:</strong> {movie.release_date}</p>
              <p className="paragraph"><strong>Rating:</strong> {movie.score} ({movie.vote_count} votes)</p>
              <p className="paragraph"><strong>Genres:</strong> {movie.types.join(', ')}</p>
              <p className="paragraph"><strong>Regions:</strong> {movie.regions.join(', ')}</p>
              <p className="paragraph"><strong>Actors:</strong> {movie.actors.slice(0, 10).join(', ')}</p>
              <p className="paragraph"><strong>Director:</strong> {movie.directors.join(', ') || 'N/A'}</p>
              <p className="paragraph"><strong>Writer:</strong> {movie.writers.join(', ') || 'N/A'}</p>
              <p className="paragraph"><strong>Languages:</strong> {movie.languages.join(', ') || 'N/A'}</p>
              <p className="paragraph"><strong>Run Time:</strong> {movie.runtime || 'N/A'} minutes</p>
            </div>
          </div>
          <div className={styles.movieSummary}>
            <Title level={3} style={{ color: 'white' }}>Introduction</Title>
            <p className="paragraph">{movie.summary || 'N/A'}</p>
          </div>
        </div>
        <div className={styles.rightPanel}>
          {comments && comments.length > 0 && <div className={styles.wordCloud}>
            <img src={`/wordclouds/${movie.id}.jpg`}  alt="Word Cloud" />
          </div>}
          { comments && comments.length > 0 && (
              <div className={styles.comments}>
                  <Title level={3} style={{ color: 'white' }}>User Reviews</Title>
                  {comments.map((item, index) => (
                      <div
                          key={index}
                          style={{
                              backgroundColor: '#2a2a2a',
                              color: 'white',
                              marginBottom: '10px',
                              padding: '10px',
                              borderRadius: '5px',
                          }}
                      >
                     <div 
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                    }}
                >
                        <strong style={{ fontSize: '1.2em' }}>{item.username} &nbsp; {getStarRating(item.score)} &nbsp; {(item.positive_rate*100).toFixed(2)}%</strong>
                    <span>{item.time}</span>
                    
                </div>
                <p style={{ color: 'white', margin: '10px 0' }}>{item.content}</p>
                      </div>
                  ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;