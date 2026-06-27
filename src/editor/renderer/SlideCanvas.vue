<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Slide } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'
import { editorStore } from '../store'
import { activeGuidelines } from '../transform'
import SlideElement from './SlideElement.vue'

const props = defineProps<{
  slide: Slide
}>()

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

/** 点击画布空白取消选中 */
function handleCanvasClick() {
  editorStore.deselectElement()
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
        <!-- 元素渲染 -->
        <SlideElement
          v-for="element in slide.elements"
          :key="element.id"
          :element="element"
          :selected="editorStore.state.selectedElementIds.includes(element.id)"
          :scale="scale"
        />

        <!-- 对齐参考线 -->
        <div
          v-for="(line, index) in activeGuidelines"
          :key="'guide-' + index"
          class="guideline"
          :class="line.type"
          :style="line.type === 'vertical'
            ? { left: line.position + 'px', top: 0, height: '100%' }
            : { top: line.position + 'px', left: 0, width: '100%' }
          "
        ></div>
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

.guideline {
  position: absolute;
  pointer-events: none;
  z-index: 999;
}

.guideline.vertical {
  width: 1px;
  background: #f5222d;
}

.guideline.horizontal {
  height: 1px;
  background: #f5222d;
}
</style>
