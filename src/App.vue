<script setup lang="ts">
import SlideCanvas from './components/SlideCanvas.vue'
import { editorStore } from './stores/editor'

const { currentSlide, state } = editorStore

// 演示操作
const handleAddSlide = () => {
  editorStore.addSlide()
}

const handleDeleteSlide = () => {
  editorStore.deleteSlide()
}

const handleAddRect = () => {
  editorStore.addElement({
    type: 'shape',
    shape: 'rect',
    left: 100,
    top: 100,
    width: 150,
    height: 100,
    fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
  })
}

const handleAddText = () => {
  editorStore.addElement({
    type: 'text',
    left: 100,
    top: 100,
    width: 200,
    height: 50,
    content: '新文本',
    fontSize: 24,
    color: '#333',
  })
}

const handleDeleteSelected = () => {
  editorStore.deleteSelectedElements()
}
</script>

<template>
  <div class="app">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="handleAddSlide">添加幻灯片</button>
      <button @click="handleDeleteSlide">删除幻灯片</button>
      <span class="divider"></span>
      <button @click="handleAddRect">添加矩形</button>
      <button @click="handleAddText">添加文本</button>
      <button @click="handleDeleteSelected">删除选中</button>
      <span class="divider"></span>
      <span class="info">当前: {{ state.currentSlideIndex + 1 }} / {{ editorStore.getSlideCount() }}</span>
    </div>

    <div class="main-content">
      <!-- 缩略图列表 - 左侧 -->
      <div class="thumbnails">
        <div
          v-for="(slide, index) in state.slides"
          :key="slide.id"
          class="thumbnail"
          :class="{ active: index === state.currentSlideIndex }"
          @click="editorStore.switchSlide(slide.id)"
        >
          <div class="thumbnail-index">{{ index + 1 }}</div>
          <div class="thumbnail-preview">
            <span>{{ slide.elements.length }} 个元素</span>
          </div>
        </div>
      </div>

      <!-- 画布区域 -->
      <div class="canvas-area">
        <SlideCanvas v-if="currentSlide" :slide="currentSlide" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
}

.toolbar {
  height: 48px;
  background: #252540;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
}

.toolbar button {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.toolbar button:hover {
  background: #2980b9;
}

.toolbar .divider {
  width: 1px;
  height: 24px;
  background: #3a3a5a;
  margin: 0 8px;
}

.toolbar .info {
  color: #888;
  font-size: 13px;
  margin-left: auto;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.thumbnails {
  width: 120px;
  background: #252540;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
  overflow-y: auto;
}

.thumbnail {
  flex-shrink: 0;
  width: 100%;
  height: 68px;
  background: #fff;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.thumbnail:hover {
  border-color: #3498db;
}

.thumbnail.active {
  border-color: #e67e22;
}

.thumbnail-index {
  font-size: 12px;
  color: #333;
  font-weight: bold;
}

.thumbnail-preview {
  font-size: 10px;
  color: #666;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
