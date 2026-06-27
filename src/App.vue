<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import SlideCanvas from './editor/renderer/SlideCanvas.vue'
import { editorStore } from './editor/store'
import { copy, cut, paste } from './editor/clipboard'

const { currentSlide, state } = editorStore

// ==================== 幻灯片操作 ====================
const handleAddSlide = () => editorStore.addSlide()
const handleDeleteSlide = () => editorStore.deleteSlide()
const handlePrevSlide = () => editorStore.prevSlide()
const handleNextSlide = () => editorStore.nextSlide()

// ==================== 元素操作 ====================
const handleAddRect = () => {
  editorStore.addElement({
    type: 'shape',
    shape: 'rect',
    left: 100 + Math.random() * 200,
    top: 100 + Math.random() * 200,
    width: 150,
    height: 100,
    fill: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
  })
}

const handleAddCircle = () => {
  editorStore.addElement({
    type: 'shape',
    shape: 'circle',
    left: 100 + Math.random() * 200,
    top: 100 + Math.random() * 200,
    width: 120,
    height: 120,
    fill: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
  })
}

const handleAddText = () => {
  editorStore.addElement({
    type: 'text',
    left: 100 + Math.random() * 200,
    top: 100 + Math.random() * 100,
    width: 200,
    height: 50,
    content: '新文本',
    fontSize: 24,
    color: '#333',
  })
}

const handleDeleteSelected = () => editorStore.deleteSelectedElements()

// ==================== 剪贴板 ====================
const handleCopy = () => copy()
const handleCut = () => cut()
const handlePaste = () => paste()

// ==================== 撤销/重做 ====================
const handleUndo = () => editorStore.undo()
const handleRedo = () => editorStore.redo()

// ==================== 快捷键 ====================
function handleKeydown(e: KeyboardEvent) {
  const isCtrl = e.ctrlKey || e.metaKey

  // Delete / Backspace 删除选中
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selectedElementIds.length > 0) {
      e.preventDefault()
      handleDeleteSelected()
    }
  }

  // Ctrl+C 复制
  if (isCtrl && e.key === 'c') {
    if (state.selectedElementIds.length > 0) {
      e.preventDefault()
      handleCopy()
    }
  }

  // Ctrl+X 剪切
  if (isCtrl && e.key === 'x') {
    if (state.selectedElementIds.length > 0) {
      e.preventDefault()
      handleCut()
    }
  }

  // Ctrl+V 粘贴
  if (isCtrl && e.key === 'v') {
    e.preventDefault()
    handlePaste()
  }

  // Ctrl+Z 撤销
  if (isCtrl && !e.shiftKey && e.key === 'z') {
    e.preventDefault()
    handleUndo()
  }

  // Ctrl+Shift+Z / Ctrl+Y 重做
  if ((isCtrl && e.shiftKey && e.key === 'z') || (isCtrl && e.key === 'y')) {
    e.preventDefault()
    handleRedo()
  }

  // ← → 切换幻灯片
  if (e.key === 'ArrowLeft' && !isCtrl && state.selectedElementIds.length === 0) {
    handlePrevSlide()
  }
  if (e.key === 'ArrowRight' && !isCtrl && state.selectedElementIds.length === 0) {
    handleNextSlide()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-group">
        <button @click="handleUndo" title="撤销 (Ctrl+Z)">↩ 撤销</button>
        <button @click="handleRedo" title="重做 (Ctrl+Y)">↪ 重做</button>
      </div>
      <span class="divider"></span>

      <div class="toolbar-group">
        <button @click="handleAddSlide">+ 幻灯片</button>
        <button @click="handleDeleteSlide">- 幻灯片</button>
        <button @click="handlePrevSlide" title="上一页">◀</button>
        <button @click="handleNextSlide" title="下一页">▶</button>
      </div>
      <span class="divider"></span>

      <div class="toolbar-group">
        <button @click="handleAddRect">▭ 矩形</button>
        <button @click="handleAddCircle">○ 圆形</button>
        <button @click="handleAddText">T 文本</button>
      </div>
      <span class="divider"></span>

      <div class="toolbar-group">
        <button @click="handleCopy" title="复制 (Ctrl+C)">复制</button>
        <button @click="handleCut" title="剪切 (Ctrl+X)">剪切</button>
        <button @click="handlePaste" title="粘贴 (Ctrl+V)">粘贴</button>
        <button @click="handleDeleteSelected" title="删除 (Delete)">删除</button>
      </div>

      <span class="info">
        第 {{ state.currentSlideIndex + 1 }} / {{ editorStore.getSlideCount() }} 页
        <template v-if="state.selectedElementIds.length"> · 选中 {{ state.selectedElementIds.length }} 个</template>
      </span>
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
  gap: 6px;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar button {
  padding: 6px 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.toolbar button:hover {
  background: #2980b9;
}

.toolbar button:active {
  background: #1a6da8;
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
