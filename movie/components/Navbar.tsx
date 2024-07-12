import React from 'react';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';

const Navbar: React.FC = () => {
  const handleClick = () => {
    // 清除localStorage中的某些项目
    localStorage.removeItem('currentMovies');
    localStorage.removeItem('currentType');
    localStorage.removeItem('currentType');
  };
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.navitem}  onClick={handleClick}>Home</Link>
      <Link href="/recommend" className={styles.navitem}  onClick={handleClick}>Recommend</Link>
      <Link href="/search" className={styles.navitem}  onClick={handleClick}>Search</Link>
    </nav>
  );
};

export default Navbar;