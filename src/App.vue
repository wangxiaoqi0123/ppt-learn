<script setup lang="ts">
import { reactive } from 'vue'
import type { Slide } from './types/slides'
import SlideCanvas from './components/SlideCanvas.vue'

/**
 * 示例幻灯片数据 —— 这就是核心：用数据驱动画布渲染
 */
const slide = reactive<Slide>({
  id: 'slide-1',
  background: '#f0f3f7',
  elements: [
    // 标题文本
    {
      id: 'title',
      type: 'text',
      left: 200,
      top: 40,
      width: 600,
      height: 80,
      content: 'PPTist 简易 Demo',
      fontSize: 40,
      fontWeight: 'bold',
      color: '#2c3e50',
      textAlign: 'center',
    },
    // 蓝色矩形
    {
      id: 'rect-1',
      type: 'shape',
      shape: 'rect',
      left: 80,
      top: 180,
      width: 250,
      height: 160,
      fill: '#3498db',
    },
    // 绿色圆形
    {
      id: 'circle-1',
      type: 'shape',
      shape: 'circle',
      left: 390,
      top: 180,
      width: 160,
      height: 160,
      fill: '#2ecc71',
    },
    // 橙色圆角矩形
    {
      id: 'rounded-1',
      type: 'shape',
      shape: 'roundedRect',
      left: 620,
      top: 180,
      width: 250,
      height: 160,
      fill: '#e67e22',
      borderColor: '#d35400',
      borderWidth: 3,
    },
    // 旋转的矩形
    {
      id: 'rotated-rect',
      type: 'shape',
      shape: 'rect',
      left: 440,
      top: 400,
      width: 120,
      height: 120,
      fill: '#9b59b6',
      rotate: 45,
    },
    // 说明文本
    {
      id: 'desc',
      type: 'text',
      left: 80,
      top: 420,
      width: 300,
      height: 60,
      content: '数据结构 → 画布渲染 → 图形展示',
      fontSize: 16,
      color: '#7f8c8d',
      textAlign: 'left',
    },
  ],
})
</script>

<template>
  <div class="app">
    <SlideCanvas :slide="slide" />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
