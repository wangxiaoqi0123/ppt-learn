import { reactive, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement, EditorState } from '../models'
import { historyManager } from '../history'

/**
 * 创建默认幻灯片
 */
function createDefaultSlide(): Slide {
  return {
    id: nanoid(),
    background: '#f0f3f7',
    elements: [
      {
        id: nanoid(),
        type: 'text',
        left: 200,
        top: 40,
        width: 600,
        height: 80,
        content: '欢迎使用 PPTist Demo',
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
      },
      {
        id: nanoid(),
        type: 'shape',
        shape: 'rect',
        left: 150,
        top: 180,
        width: 200,
        height: 120,
        fill: '#3498db',
      },
      {
        id: nanoid(),
        type: 'shape',
        shape: 'circle',
        left: 400,
        top: 180,
        width: 120,
        height: 120,
        fill: '#2ecc71',
      },
    ],
  }
}

/**
 * 创建编辑器 Store
 */
export function createEditorStore() {
  const state = reactive<EditorState>({
    slides: [createDefaultSlide()],
    selectedSlideId: null,
    selectedElementIds: [],
    currentSlideIndex: 0,
  })

  const currentSlide = computed(() => {
    if (state.slides.length === 0) return null
    return state.slides[state.currentSlideIndex] || null
  })

  const selectedElements = computed(() => {
    const slide = currentSlide.value
    if (!slide) return []
    return slide.elements.filter(el => state.selectedElementIds.includes(el.id))
  })

  /** 保存快照（在修改操作前调用） */
  const snapshot = () => {
    historyManager.snapshot(state.slides)
  }

  /** 撤销 */
  const undo = () => {
    const prev = historyManager.undo(state.slides)
    if (prev) {
      state.slides.splice(0, state.slides.length, ...prev)
      // 修正索引
      if (state.currentSlideIndex >= state.slides.length) {
        state.currentSlideIndex = state.slides.length - 1
      }
      state.selectedElementIds = []
    }
  }

  /** 重做 */
  const redo = () => {
    const next = historyManager.redo(state.slides)
    if (next) {
      state.slides.splice(0, state.slides.length, ...next)
      if (state.currentSlideIndex >= state.slides.length) {
        state.currentSlideIndex = state.slides.length - 1
      }
      state.selectedElementIds = []
    }
  }

  // ==================== 幻灯片操作 ====================

  const addSlide = (slide?: Partial<Slide>): Slide => {
    snapshot()
    const newSlide: Slide = {
      id: nanoid(),
      background: '#ffffff',
      elements: [],
      ...slide,
    }
    state.slides.splice(state.currentSlideIndex + 1, 0, newSlide)
    state.currentSlideIndex++
    state.selectedSlideId = newSlide.id
    state.selectedElementIds = []
    return newSlide
  }

  const deleteSlide = (slideId?: string): boolean => {
    const targetId = slideId || state.slides[state.currentSlideIndex]?.id
    if (!targetId) return false
    const index = state.slides.findIndex(slide => slide.id === targetId)
    if (index === -1 || state.slides.length <= 1) return false

    snapshot()
    state.slides.splice(index, 1)
    if (state.currentSlideIndex >= state.slides.length) {
      state.currentSlideIndex = state.slides.length - 1
    }
    const current = state.slides[state.currentSlideIndex]
    state.selectedSlideId = current?.id || null
    state.selectedElementIds = []
    return true
  }

  const switchSlide = (slideId: string): boolean => {
    const index = state.slides.findIndex(slide => slide.id === slideId)
    if (index === -1) return false
    state.currentSlideIndex = index
    state.selectedSlideId = slideId
    state.selectedElementIds = []
    return true
  }

  // ==================== 元素操作 ====================

  const addElement = (element: Omit<PPTElement, 'id'>): PPTElement | null => {
    const slide = currentSlide.value
    if (!slide) return null
    snapshot()
    const newElement = { id: nanoid(), ...element } as PPTElement
    slide.elements.push(newElement)
    state.selectedElementIds = [newElement.id]
    return newElement
  }

  /**
   * 更新元素
   * @param saveHistory 是否保存快照（拖拽过程中不需要每帧保存）
   */
  const updateElement = (elementId: string, updates: Partial<PPTElement>, saveHistory = false): boolean => {
    const slide = currentSlide.value
    if (!slide) return false
    const index = slide.elements.findIndex(el => el.id === elementId)
    if (index === -1) return false

    if (saveHistory) snapshot()

    const currentElement = slide.elements[index]
    slide.elements[index] = {
      ...currentElement,
      ...updates,
      type: currentElement.type,
    } as PPTElement
    return true
  }

  const deleteElement = (elementId?: string): boolean => {
    const slide = currentSlide.value
    if (!slide) return false
    const targetId = elementId || state.selectedElementIds[0]
    if (!targetId) return false
    const index = slide.elements.findIndex(el => el.id === targetId)
    if (index === -1) return false

    snapshot()
    slide.elements.splice(index, 1)
    state.selectedElementIds = state.selectedElementIds.filter(id => id !== targetId)
    return true
  }

  const deleteSelectedElements = (): boolean => {
    const slide = currentSlide.value
    if (!slide || state.selectedElementIds.length === 0) return false

    snapshot()
    slide.elements = slide.elements.filter(
      el => !state.selectedElementIds.includes(el.id)
    )
    state.selectedElementIds = []
    return true
  }

  // ==================== 选择操作 ====================

  const selectElement = (elementId: string | string[], reset: boolean = true): void => {
    const ids = Array.isArray(elementId) ? elementId : [elementId]
    if (reset) {
      state.selectedElementIds = ids
    } else {
      state.selectedElementIds = [...new Set([...state.selectedElementIds, ...ids])]
    }
  }

  const deselectElement = (elementId?: string): void => {
    if (!elementId) {
      state.selectedElementIds = []
    } else {
      state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId)
    }
  }

  // ==================== 导航 ====================

  const prevSlide = (): boolean => {
    if (state.currentSlideIndex > 0) {
      state.currentSlideIndex--
      state.selectedElementIds = []
      return true
    }
    return false
  }

  const nextSlide = (): boolean => {
    if (state.currentSlideIndex < state.slides.length - 1) {
      state.currentSlideIndex++
      state.selectedElementIds = []
      return true
    }
    return false
  }

  const getSlideCount = (): number => state.slides.length

  return {
    state,
    currentSlide,
    selectedElements,
    snapshot,
    undo,
    redo,
    addSlide,
    deleteSlide,
    switchSlide,
    prevSlide,
    nextSlide,
    getSlideCount,
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElements,
    selectElement,
    deselectElement,
  }
}

export const editorStore = createEditorStore()
