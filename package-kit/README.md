# React 3D 海报展框组件包

可嵌入其他 React 项目的 3:4 海报展示组件，包含八款三维边框、玻璃、灯光、鼠标拖动旋转、滚轮缩放、PNG 导出和可调画质。

## 安装预构建包

目标项目需要使用 **React 19**。将压缩包中的 `atelier-poster-frame-1.0.0.tgz` 复制到目标项目根目录，执行：

```sh
npm install ./atelier-poster-frame-1.0.0.tgz
```

组件以 ESM 形式提供，附带 TypeScript 类型。`react`、`react-dom` 和 `three` 是 peer dependencies；项目应使用 React / React DOM 19，以及 `three ^0.181.0`（即 `0.181.x`）。R3F、drei、后处理等运行依赖由包声明管理。此文件是本地安装包，无需发布到 npm。

```tsx
import { PosterFrame } from '@atelier/poster-frame';

export default function ProductPreview() {
  return (
    <PosterFrame
      posterSrc="/posters/poster-1.png"
      defaultFrame="walnut"
      defaultQuality="balanced"
      showControls
      style={{ width: '100%', height: 600 }}
    />
  );
}
```

可将包中的 `examples/posters` 目录复制到目标项目的 `public/posters`，即可使用上述路径；也可以把 `posterSrc` 换成自己的图片。三张示例 PNG 是 Canvas 原创排版生成的演示素材，不是网络图片或 AI 生成图片；对应生成代码在 `examples/generatePosters.ts`。组件入口不加载这些示例海报，不要求复制原展厅页面或全局 CSS。

## 直接使用源码

将 `src/poster-frame` 整个目录复制到目标项目的源码目录，保留内部相对路径，安装运行依赖：

```sh
npm install @react-three/fiber@^9 @react-three/drei@^10 @react-three/postprocessing@^3 postprocessing@^6 three@^0.181
```

TypeScript 项目还需安装对应类型：

```sh
npm install -D @types/three@^0.181
```

然后把导入改为复制目录的路径：

```tsx
import { PosterFrame } from './poster-frame';
```

React 19 和 React DOM 19 应由目标项目提供。源码方案适用于已经配置 TSX 的 React 构建工具；无需额外样式加载器。

## 组件参数

| 参数 | 类型 | 默认值 / 用途 |
| --- | --- | --- |
| `posterSrc` | `string` | 必填，图片 URL、`blob:` 或 `data:` 地址 |
| `frame` | `FrameId` | 受控框型，需同时处理 `onFrameChange` |
| `defaultFrame` | `FrameId` | `champagne`，非受控模式的初始框型 |
| `quality` | `'fast' \| 'balanced' \| 'quality'` | 受控画质，需同时处理 `onQualityChange` |
| `defaultQuality` | `'fast' \| 'balanced' \| 'quality'` | `balanced`，非受控模式的初始画质 |
| `settings` | `Partial<RenderSettings>` | 覆盖所选预设的具体渲染参数 |
| `warm` | `boolean` | `true`，暖光；`false` 为冷光 |
| `reducedMotion` | `boolean` | 默认跟随系统减少动态效果偏好 |
| `showControls` | `boolean` | `false`；开启后显示框型、画质及重置控件 |
| `className` | `string` | 容器类名 |
| `style` | `React.CSSProperties` | 默认宽度 `100%`、高度 `600px` |
| `onReady` | `() => void` | 当前海报纹理准备完成 |
| `onError` | `(error: Error) => void` | 图片加载、渲染等错误回调 |
| `onFrameChange` | `(id: FrameId) => void` | 内置控件选择框型时触发 |
| `onQualityChange` | `(quality: QualityPreset) => void` | 内置控件选择画质预设时触发 |
| `onSettingsChange` | `(settings: RenderSettings) => void` | 内置控件更新画质时触发 |

容器必须有实际高度；如果使用百分比高度，父容器也需要设置高度。组件不添加全局 CSS，也不会自动持久化设置。需要保存选择时，由宿主应用管理状态与存储。

使用内置控件且不需要管理状态时，传 `defaultFrame` / `defaultQuality`。显式传入 `frame` / `quality` 后，组件会进入对应的受控模式：控件仅发出回调，由宿主更新值。`settings` 始终覆盖所选预设；若同时控制完整 `settings`，切换预设时也应通过 `onSettingsChange` 更新它。

### 框型 ID

| ID | 样式 |
| --- | --- |
| `champagne` | 香槟金细框 |
| `graphite` | 曜石黑细框 |
| `silver` | 雾银拉丝细框 |
| `walnut` | 胡桃木实木宽框 |
| `oak` | 浅橡木实木宽框 |
| `travertine` | 洞石阶梯框 |
| `marble` | 白大理石圆弧框 |
| `bronze` | 雕纹古铜浮雕框 |

`frames` 导出完整目录，可用于生成宿主项目自己的选择器。纹理在本地按当前框型生成；普通框型为 512px，古铜为 1024px，并包含实例化叶形浮雕与珠饰。

### 渲染参数

```ts
type RenderSettings = {
  resolution: number;
  antialias: 'off' | 'fxaa' | 'smaa' | 'msaa';
  ao: 'off' | 'low' | 'high';
  shadows: boolean;
  bloom: boolean;
  glass: boolean;
};
```

`resolution` 是渲染像素比，建议范围为 `0.75–2`。`msaa` 使用 4× 采样；`low` 环境遮蔽使用半分辨率。透明玻璃可通过 `glass` 开关。

| 预设 | 主要设置 |
| --- | --- |
| `fast` | 1×、FXAA；关闭环境遮蔽、阴影、辉光与玻璃透射 |
| `balanced` | 1×、FXAA、低开销半分辨率环境遮蔽、阴影与玻璃；辉光关闭 |
| `quality` | 1.5×、SMAA、全分辨率环境遮蔽、阴影、辉光与玻璃 |

`qualityPresets` 导出这些设置。卡顿时优先使用 `fast` 或降低 `resolution`；抗锯齿模式互斥，不叠加。实现采用实时 WebGL PBR、环境光照和后处理，不是真正的硬件光线追踪。

## 通过 ref 控制

```tsx
import { useRef } from 'react';
import { PosterFrame } from '@atelier/poster-frame';
import type { PosterFrameHandle } from '@atelier/poster-frame';

export default function Preview() {
  const viewer = useRef<PosterFrameHandle>(null);

  async function createPng() {
    try {
      const canvas = viewer.current?.getCanvas();
      const png = await viewer.current?.exportPng();
      console.log(canvas, png); // 可把 Blob 交给宿主的下载或上传逻辑。
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <PosterFrame ref={viewer} posterSrc="/poster.jpg" />
      <button onClick={() => viewer.current?.resetView()}>重置</button>
      <button onClick={() => void createPng()}>生成 PNG</button>
    </>
  );
}
```

`resetView()` 同时恢复角度与缩放。`getCanvas()` 在画布创建前返回 `null`。`exportPng()` 返回当前 3D 画面的 PNG `Blob`，不包含 HTML 控件；失败时 Promise 会拒绝，宿主应用应处理错误。

`examples/Basic.tsx` 是最小接入示例，`examples/Controlled.tsx` 展示自定义控制栏、文件上传、画质状态和 PNG 下载。

## 图片和框架集成

- 海报按 3:4 居中裁切填满开口；使用 3:4 图片可以保留完整构图。
- 外部图片服务器需允许 CORS。优先使用同源 `public` 路径，或上传文件生成的 `blob:` 地址；替换、卸载时释放自己创建的 Object URL。
- 图片和纹理均在浏览器处理；组件不会上传图片，也不提供后端存储。
- 需要浏览器支持 WebGL2，并开启硬件加速。上传、错误提示和加载提示可由宿主应用通过回调实现。
- Next.js 中在客户端组件文件顶部添加 `'use client'`；如果宿主渲染环境仍尝试在服务端加载 WebGL 相关模块，可通过 `next/dynamic` 设置 `ssr: false` 后使用。
- 原展厅的键盘快捷键、帮助弹窗、沉浸模式和页面级上传 UI 不属于基础组件；可在宿主页面按需添加。
