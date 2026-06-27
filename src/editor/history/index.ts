import { ref } from 'vue'
import type { Slide } from '../models'

/**
 * 快照式撤销/重做管理
 * 每次操作前保存整个 slides 的深拷贝
 */
export function createHistoryManager(maxLength = 30) {
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  /** 保存当前快照 */
  const snapshot = (slides: Slide[]) => {
    undoStack.value.push(JSON.stringify(slides))
    if (undoStack.value.length > maxLength) {
      undoStack.value.shift()
    }
    // 新操作清空 redo 栈
    redoStack.value = []
  }

  /** 撤销，返回上一个状态 */
  const undo = (currentSlides: Slide[]): Slide[] | null => {
    if (undoStack.value.length === 0) return null
    // 保存当前状态到 redo
    redoStack.value.push(JSON.stringify(currentSlides))
    // 弹出上一个状态
    const prev = undoStack.value.pop()!
    return JSON.parse(prev)
  }

  /** 重做，返回下一个状态 */
  const redo = (currentSlides: Slide[]): Slide[] | null => {
    if (redoStack.value.length === 0) return null
    // 保存当前状态到 undo
    undoStack.value.push(JSON.stringify(currentSlides))
    const next = redoStack.value.pop()!
    return JSON.parse(next)
  }

  const canUndo = () => undoStack.value.length > 0
  const canRedo = () => redoStack.value.length > 0

  return { snapshot, undo, redo, canUndo, canRedo }
}

export const historyManager = createHistoryManager()
