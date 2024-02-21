import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'B站录播同步视听',
        description: '在B站视频内外挂本地视频，主要用于看录播时和主播同步看B站直播不能放出画面的视频',
        author: 'icinggslits',
        icon: 'https://www.bilibili.com/favicon.ico',
        namespace: 'simultaneous-hearing-and-sight',
        match: ['*://www.bilibili.com/video/*'],
        version: '0.0.1',
      },
    }),
  ],
});
