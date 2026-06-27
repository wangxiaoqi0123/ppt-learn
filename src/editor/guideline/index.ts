import type { PPTElement } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'

/**
 * 对齐参考线
 */
export interface Guideline {
  type: 'horizontal' | 'vertical'
  position: number // 画布坐标位置
}

/** 吸附阈值（画布坐标） */
const SNAP_THRESHOLD = 5

/**
 * 计算当前拖拽元素的对齐参考线
 */
export function calcGuidelines(
  currentElement: PPTElement,
  otherElements: PPTElement[]
): Guideline[] {
  const lines: Guideline[] = []

  const curCenterX = currentElement.left + currentElement.width / 2
  const curCenterY = currentElement.top + currentElement.height / 2
  const curRight = currentElement.left + currentElement.width
  const curBottom = currentElement.top + currentElement.height

  // 画布中线
  if (Math.abs(curCenterX - CANVAS_WIDTH / 2) < SNAP_THRESHOLD) {
    lines.push({ type: 'vertical', position: CANVAS_WIDTH / 2 })
  }
  if (Math.abs(curCenterY - CANVAS_HEIGHT / 2) < SNAP_THRESHOLD) {
    lines.push({ type: 'horizontal', position: CANVAS_HEIGHT / 2 })
  }

  // 与其他元素对齐
  for (const el of otherElements) {
    if (el.id === currentElement.id) continue

    const elCenterX = el.left + el.width / 2
    const elCenterY = el.top + el.height / 2
    const elRight = el.left + el.width
    const elBottom = el.top + el.height

    // 垂直对齐：左、中、右
    if (Math.abs(currentElement.left - el.left) < SNAP_THRESHOLD) {
      lines.push({ type: 'vertical', position: el.left })
    }
    if (Math.abs(curCenterX - elCenterX) < SNAP_THRESHOLD) {
      lines.push({ type: 'vertical', position: elCenterX })
    }
    if (Math.abs(curRight - elRight) < SNAP_THRESHOLD) {
      lines.push({ type: 'vertical', position: elRight })
    }

    // 水平对齐：上、中、下
    if (Math.abs(currentElement.top - el.top) < SNAP_THRESHOLD) {
      lines.push({ type: 'horizontal', position: el.top })
    }
    if (Math.abs(curCenterY - elCenterY) < SNAP_THRESHOLD) {
      lines.push({ type: 'horizontal', position: elCenterY })
    }
    if (Math.abs(curBottom - elBottom) < SNAP_THRESHOLD) {
      lines.push({ type: 'horizontal', position: elBottom })
    }
  }

  return lines
}

/**
 * 吸附修正坐标
 */
export function snapPosition(
  element: PPTElement,
  otherElements: PPTElement[]
): { left: number; top: number } {
  let { left, top } = element
  const centerX = left + element.width / 2
  const centerY = top + element.height / 2

  // 画布中线吸附
  if (Math.abs(centerX - CANVAS_WIDTH / 2) < SNAP_THRESHOLD) {
    left = CANVAS_WIDTH / 2 - element.width / 2
  }
  if (Math.abs(centerY - CANVAS_HEIGHT / 2) < SNAP_THRESHOLD) {
    top = CANVAS_HEIGHT / 2 - element.height / 2
  }

  // 其他元素吸附
  for (const el of otherElements) {
    if (el.id === element.id) continue

    // 左对齐
    if (Math.abs(left - el.left) < SNAP_THRESHOLD) left = el.left
    // 右对齐
    if (Math.abs(left + element.width - (el.left + el.width)) < SNAP_THRESHOLD) {
      left = el.left + el.width - element.width
    }
    // 上对齐
    if (Math.abs(top - el.top) < SNAP_THRESHOLD) top = el.top
    // 下对齐
    if (Math.abs(top + element.height - (el.top + el.height)) < SNAP_THRESHOLD) {
      top = el.top + el.height - element.height
    }
  }

  return { left, top }
}
