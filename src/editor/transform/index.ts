import type { PPTElement } from '../models'
import { editorStore } from '../store'
import { snapPosition, calcGuidelines } from '../guideline'
import type { Guideline } from '../guideline'
import { ref } from 'vue'

/** 当前正在显示的对齐参考线（响应式，供渲染层使用） */
export const activeGuidelines = ref<Guideline[]>([])

/**
 * 拖拽移动处理
 * 拖拽开始时保存一次快照，过程中启用吸附+参考线
 */
export function startDrag(
  element: PPTElement,
  e: MouseEvent,
  scale: number
) {
  editorStore.snapshot()

  const startX = e.clientX
  const startY = e.clientY
  const startLeft = element.left
  const startTop = element.top

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const dx = (moveEvent.clientX - startX) / scale
    const dy = (moveEvent.clientY - startY) / scale

    const rawLeft = startLeft + dx
    const rawTop = startTop + dy

    // 获取其他元素
    const slide = editorStore.currentSlide.value
    const otherElements = slide ? slide.elements.filter(el => el.id !== element.id) : []

    // 创建临时元素用于吸附计算
    const tempElement = { ...element, left: rawLeft, top: rawTop }

    // 吸附修正
    const snapped = snapPosition(tempElement, otherElements)

    // 计算参考线
    const snappedElement = { ...tempElement, left: snapped.left, top: snapped.top }
    activeGuidelines.value = calcGuidelines(snappedElement, otherElements)

    editorStore.updateElement(element.id, {
      left: snapped.left,
      top: snapped.top,
    })
  }

  const handleMouseUp = () => {
    // 清除参考线
    activeGuidelines.value = []
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

/**
 * 缩放处理
 * 同样在开始时保存一次快照
 */
export function startResize(
  element: PPTElement,
  handle: 'tl' | 'tr' | 'bl' | 'br',
  e: MouseEvent,
  scale: number
) {
  editorStore.snapshot()

  const startX = e.clientX
  const startY = e.clientY
  const startLeft = element.left
  const startTop = element.top
  const startWidth = element.width
  const startHeight = element.height

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const dx = (moveEvent.clientX - startX) / scale
    const dy = (moveEvent.clientY - startY) / scale

    let newLeft = startLeft
    let newTop = startTop
    let newWidth = startWidth
    let newHeight = startHeight

    switch (handle) {
      case 'br':
        newWidth = Math.max(20, startWidth + dx)
        newHeight = Math.max(20, startHeight + dy)
        break
      case 'bl':
        newLeft = startLeft + dx
        newWidth = Math.max(20, startWidth - dx)
        newHeight = Math.max(20, startHeight + dy)
        break
      case 'tr':
        newTop = startTop + dy
        newWidth = Math.max(20, startWidth + dx)
        newHeight = Math.max(20, startHeight - dy)
        break
      case 'tl':
        newLeft = startLeft + dx
        newTop = startTop + dy
        newWidth = Math.max(20, startWidth - dx)
        newHeight = Math.max(20, startHeight - dy)
        break
    }

    editorStore.updateElement(element.id, {
      left: newLeft,
      top: newTop,
      width: newWidth,
      height: newHeight,
    })
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
