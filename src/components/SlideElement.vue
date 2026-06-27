<script setup lang="ts">
import { computed } from 'vue'
import type { PPTElement } from '../types/slides'

const props = defineProps<{
  element: PPTElement
}>()

/** 元素的定位和尺寸样式 */
const baseStyle = computed(() => ({
  position: 'absolute' as const,
  left: props.element.left + 'px',
  top: props.element.top + 'px',
  width: props.element.width + 'px',
  height: props.element.height + 'px',
  transform: props.element.rotate ? `rotate(${props.element.rotate}deg)` : undefined,
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
</script>

<template>
  <!-- 文本元素 -->
  <div v-if="element.type === 'text'" :style="{ ...baseStyle, ...textStyle }">
    {{ element.content }}
  </div>

  <!-- 形状元素 -->
  <div v-else-if="element.type === 'shape'" :style="{ ...baseStyle, ...shapeStyle }"></div>

  <!-- 图片元素 -->
  <img
    v-else-if="element.type === 'image'"
    :src="element.src"
    :style="{ ...baseStyle, objectFit: 'cover' }"
  />
</template>
