import { reactive, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement } from '../types/slides'

/**
 * 编辑器状态
 */
export interface EditorState {
  slides: Slide[]
  selectedSlideId: string | null
  selectedElementIds: string[]
  currentSlideIndex: number
}

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
  // 状态
  const state = reactive<EditorState>({
    slides: [createDefaultSlide()],
    selectedSlideId: null,
    selectedElementIds: [],
    currentSlideIndex: 0,
  })

  // 计算属性：当前幻灯片
  const currentSlide = computed(() => {
    if (state.slides.length === 0) return null
    return state.slides[state.currentSlideIndex] || null
  })

  // 计算属性：选中的元素列表
  const selectedElements = computed(() => {
    const slide = currentSlide.value
    if (!slide) return []
    return slide.elements.filter(el => state.selectedElementIds.includes(el.id))
  })

  // ==================== 幻灯片操作 ====================

  /** 添加新幻灯片 */
  const addSlide = (slide?: Partial<Slide>): Slide => {
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

  /** 删除幻灯片 */
  const deleteSlide = (slideId?: string): boolean => {
    const targetId = slideId || state.slides[state.currentSlideIndex]?.id
    if (!targetId) return false

    const index = state.slides.findIndex(slide => slide.id === targetId)
    if (index === -1) return false

    // 至少保留一页
    if (state.slides.length <= 1) return false

    state.slides.splice(index, 1)

    // 调整索引
    if (state.currentSlideIndex >= state.slides.length) {
      state.currentSlideIndex = state.slides.length - 1
    }

    const current = state.slides[state.currentSlideIndex]
    state.selectedSlideId = current?.id || null
    state.selectedElementIds = []

    return true
  }

  /** 切换幻灯片 */
  const switchSlide = (slideId: string): boolean => {
    const index = state.slides.findIndex(slide => slide.id === slideId)
    if (index === -1) return false

    state.currentSlideIndex = index
    state.selectedSlideId = slideId
    state.selectedElementIds = []
    return true
  }

  // ==================== 元素操作 ====================

  /** 添加元素 */
  const addElement = (element: Omit<PPTElement, 'id'>): PPTElement | null => {
    const slide = currentSlide.value
    if (!slide) return null

    const newElement = {
      id: nanoid(),
      ...element,
    } as PPTElement

    slide.elements.push(newElement)
    state.selectedElementIds = [newElement.id]

    return newElement
  }

  /** 更新元素 */
  const updateElement = (elementId: string, updates: Partial<PPTElement>): boolean => {
    const slide = currentSlide.value
    if (!slide) return false

    const index = slide.elements.findIndex(el => el.id === elementId)
    if (index === -1) return false

    const currentElement = slide.elements[index]
    
    // 合并更新，保持 type 不变，使用类型断言避免联合类型收窄问题
    slide.elements[index] = {
      ...currentElement,
      ...updates,
      type: currentElement.type, // 显式保持 type 不变
    } as PPTElement

    return true
  }

  /** 删除元素 */
  const deleteElement = (elementId?: string): boolean => {
    const slide = currentSlide.value
    if (!slide) return false

    const targetId = elementId || state.selectedElementIds[0]
    if (!targetId) return false

    const index = slide.elements.findIndex(el => el.id === targetId)
    if (index === -1) return false

    slide.elements.splice(index, 1)
    state.selectedElementIds = state.selectedElementIds.filter(id => id !== targetId)

    return true
  }

  /** 批量删除选中的元素 */
  const deleteSelectedElements = (): boolean => {
    const slide = currentSlide.value
    if (!slide || state.selectedElementIds.length === 0) return false

    slide.elements = slide.elements.filter(
      el => !state.selectedElementIds.includes(el.id)
    )
    state.selectedElementIds = []
    return true
  }

  // ==================== 选择操作 ====================

  /** 选中元素 */
  const selectElement = (elementId: string | string[], reset: boolean = true): void => {
    const ids = Array.isArray(elementId) ? elementId : [elementId]
    
    if (reset) {
      state.selectedElementIds = ids
    } else {
      state.selectedElementIds = [...new Set([...state.selectedElementIds, ...ids])]
    }
  }

  /** 取消选中 */
  const deselectElement = (elementId?: string): void => {
    if (!elementId) {
      state.selectedElementIds = []
    } else {
      state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId)
    }
  }

  // ==================== 工具方法 ====================

  /** 切换到上一页 */
  const prevSlide = (): boolean => {
    if (state.currentSlideIndex > 0) {
      state.currentSlideIndex--
      state.selectedElementIds = []
      return true
    }
    return false
  }

  /** 切换到下一页 */
  const nextSlide = (): boolean => {
    if (state.currentSlideIndex < state.slides.length - 1) {
      state.currentSlideIndex++
      state.selectedElementIds = []
      return true
    }
    return false
  }

  /** 获取幻灯片数量 */
  const getSlideCount = (): number => state.slides.length

  return {
    // 状态
    state,
    currentSlide,
    selectedElements,

    // 幻灯片操作
    addSlide,
    deleteSlide,
    switchSlide,
    prevSlide,
    nextSlide,
    getSlideCount,

    // 元素操作
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElements,

    // 选择操作
    selectElement,
    deselectElement,
  }
}

// 导出单例
export const editorStore = createEditorStore()
