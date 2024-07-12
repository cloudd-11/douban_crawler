import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>My Next.js App</title>
        <meta name="description" content="Generated by create next app" />
      </Head>
      <Navbar />
      <header className={styles.heroSection}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Explore The Best Movies</h1>
          <p className={styles.heroSubtitle}>Discover and enjoy the world of movies</p>
        </div>
      </header>
    </div>
  );
};

export default Home;