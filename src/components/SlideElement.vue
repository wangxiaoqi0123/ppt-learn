<script setup lang="ts">
import { computed } from 'vue'
import type { PPTElement } from '../types/slides'

const props = defineProps<{
  element: PPTElement
  selected?: boolean
  scale?: number
}>()

const emit = defineEmits<{
  select: [elementId: string, e: MouseEvent]
  move: [elementId: string, dx: number, dy: number]
}>()

/** 元素的定位和尺寸样式 */
const baseStyle = computed(() => ({
  position: 'absolute' as const,
  left: props.element.left + 'px',
  top: props.element.top + 'px',
  width: props.element.width + 'px',
  height: props.element.height + 'px',
  transform: props.element.rotate ? `rotate(${props.element.rotate}deg)` : undefined,
  cursor: 'move',
}))

/** 文本元素样式 */
const textStyle = computed(() => {
  if (props.element.type !== 'text') return {}
  return {
    fontSize: (props.element.fontSize || 16) + 'px',
    color: props.element.color || '#333',
    fontWeight: props.element.fontWeight || 'normal',
    textAlign: props.element.textAlign || 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: props.element.textAlign === 'center' ? 'center' : 'flex-start',
    padding: '8px',
    wordBreak: 'break-word' as const,
  }
})

/** 形状元素样式 */
const shapeStyle = computed(() => {
  if (props.element.type !== 'shape') return {}
  const el = props.element
  return {
    backgroundColor: el.fill || '#4A90D9',
    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#333'}` : 'none',
    borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'roundedRect' ? '8px' : '0',
  }
})

/** 鼠标按下开始拖拽 */
function handleMouseDown(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()

  emit('select', props.element.id, e)

  const currentScale = props.scale || 1
  const startX = e.clientX
  const startY = e.clientY
  const startLeft = props.element.left
  const startTop = props.element.top

  const handleMouseMove = (moveEvent: MouseEvent) => {
    // 屏幕像素差 / 缩放比例 = 画布坐标差
    const dx = (moveEvent.clientX - startX) / currentScale
    const dy = (moveEvent.clientY - startY) / currentScale
    emit('move', props.element.id, startLeft + dx, startTop + dy)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div
    class="element-wrapper"
    :class="{ selected }"
    :style="baseStyle"
    @mousedown="handleMouseDown"
  >
    <!-- 文本元素 -->
    <div v-if="element.type === 'text'" class="element-content" :style="textStyle">
      {{ element.content }}
    </div>

    <!-- 形状元素 -->
    <div v-else-if="element.type === 'shape'" class="element-content" :style="shapeStyle"></div>

    <!-- 图片元素 -->
    <img
      v-else-if="element.type === 'image'"
      :src="element.src"
      class="element-content"
      style="object-fit: cover"
    />

    <!-- 选中边框 -->
    <div v-if="selected" class="selection-border">
      <div class="handle tl"></div>
      <div class="handle tr"></div>
      <div class="handle bl"></div>
      <div class="handle br"></div>
    </div>
  </div>
</template>

<style scoped>
.element-wrapper {
  user-select: none;
}

.element-content {
  width: 100%;
  height: 100%;
}

.selection-border {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border: 2px solid #3498db;
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 2px solid #3498db;
  border-radius: 50%;
}

.handle.tl { top: -4px; left: -4px; }
.handle.tr { top: -4px; right: -4px; }
.handle.bl { bottom: -4px; left: -4px; }
.handle.br { bottom: -4px; right: -4px; }
</style>
