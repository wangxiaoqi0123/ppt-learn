<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Slide } from '../types/slides'
import { editorStore } from '../stores/editor'
import SlideElement from './SlideElement.vue'

const props = defineProps<{
  slide: Slide
}>()

/**
 * 画布基准尺寸 (PPTist 使用 1000 x 562.5，即 16:9 比例)
 */
const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 562.5

const containerRef = ref<HTMLDivElement>()
const scale = ref(1)

/** 根据容器可用空间计算缩放比例 */
function updateScale() {
  if (!containerRef.value) return
  const padding = 50
  const availableWidth = containerRef.value.clientWidth - padding * 2
  const availableHeight = containerRef.value.clientHeight - padding * 2

  const scaleX = availableWidth / CANVAS_WIDTH
  const scaleY = availableHeight / CANVAS_HEIGHT
  scale.value = Math.min(scaleX, scaleY)
}

const wrapperStyle = computed(() => ({
  width: Math.round(CANVAS_WIDTH * scale.value) + 'px',
  height: Math.round(CANVAS_HEIGHT * scale.value) + 'px',
}))

const canvasStyle = computed(() => ({
  width: CANVAS_WIDTH + 'px',
  height: CANVAS_HEIGHT + 'px',
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  background: props.slide.background || '#fff',
}))

/** 点击画布空白区域取消选中 */
function handleCanvasClick() {
  editorStore.deselectElement()
}

/** 选中元素 */
function handleSelectElement(elementId: string, e: MouseEvent) {
  editorStore.selectElement(elementId)
}

/** 拖拽移动元素 */
function handleMoveElement(elementId: string, newLeft: number, newTop: number) {
  editorStore.updateElement(elementId, { left: newLeft, top: newTop })
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})
</script>

<template>
  <div class="canvas-container" ref="containerRef">
    <div class="canvas-wrapper" :style="wrapperStyle">
      <div class="canvas" :style="canvasStyle" @mousedown="handleCanvasClick">
        <SlideElement
          v-for="element in slide.elements"
          :key="element.id"
          :element="element"
          :selected="editorStore.state.selectedElementIds.includes(element.id)"
          :scale="scale"
          @select="handleSelectElement"
          @move="handleMoveElement"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  overflow: visible;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 0 3px 18px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>
