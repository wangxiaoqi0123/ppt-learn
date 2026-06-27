<script setup lang="ts">
import { computed } from 'vue'
import type { PPTElement } from '../models'
import { startDrag, startResize } from '../transform'
import { editorStore } from '../store'

const props = defineProps<{
  element: PPTElement
  selected?: boolean
  scale?: number
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

/** 鼠标按下：选中 + 开始拖拽 */
function handleMouseDown(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  editorStore.selectElement(props.element.id)
  startDrag(props.element, e, props.scale || 1)
}

/** 控制点按下：开始缩放 */
function handleHandleMouseDown(handle: 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  startResize(props.element, handle, e, props.scale || 1)
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

    <!-- 选中边框 + 控制点 -->
    <div v-if="selected" class="selection-border">
      <div class="handle tl" @mousedown="handleHandleMouseDown('tl', $event)"></div>
      <div class="handle tr" @mousedown="handleHandleMouseDown('tr', $event)"></div>
      <div class="handle bl" @mousedown="handleHandleMouseDown('bl', $event)"></div>
      <div class="handle br" @mousedown="handleHandleMouseDown('br', $event)"></div>
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
  pointer-events: all;
  cursor: nwse-resize;
}

.handle.tl { top: -5px; left: -5px; cursor: nwse-resize; }
.handle.tr { top: -5px; right: -5px; cursor: nesw-resize; }
.handle.bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
.handle.br { bottom: -5px; right: -5px; cursor: nwse-resize; }
</style>
