import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const external=['react','react-dom','three','@react-three/fiber','@react-three/drei','@react-three/postprocessing','postprocessing'];
export default defineConfig({publicDir:false,plugins:[react()],build:{outDir:'package-kit/lib',emptyOutDir:false,lib:{entry:'src/library.ts',formats:['es'],fileName:()=> 'poster-frame.js'},rollupOptions:{external:id=>external.some(name=>id===name||id.startsWith(`${name}/`)),output:{banner:'"use client";'}}}});
