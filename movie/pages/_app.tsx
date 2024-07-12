import React from 'react';
import { AppProps } from 'next/app';
//import 'antd/dist/antd.css';  // 引入 antd 样式
import '../styles/globals.css';

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default MyApp;