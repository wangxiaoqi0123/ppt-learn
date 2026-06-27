/**
 * PPT 元素的基础属性
 */
export interface PPTBaseElement {
  id: string
  left: number   // 距离左侧的位置 (px，基于1000x562.5的画布)
  top: number    // 距离顶部的位置
  width: number  // 宽度
  height: number // 高度
  rotate?: number // 旋转角度
}

/**
 * 文本元素
 */
export interface PPTTextElement extends PPTBaseElement {
  type: 'text'
  content: string
  fontSize?: number
  color?: string
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
}

/**
 * 矩形/形状元素
 */
export interface PPTShapeElement extends PPTBaseElement {
  type: 'shape'
  shape: 'rect' | 'circle' | 'roundedRect'
  fill?: string
  borderColor?: string
  borderWidth?: number
}

/**
 * 图片元素
 */
export interface PPTImageElement extends PPTBaseElement {
  type: 'image'
  src: string
}

/**
 * 所有元素的联合类型
 */
export type PPTElement = PPTTextElement | PPTShapeElement | PPTImageElement

/**
 * 一页幻灯片
 */
export interface Slide {
  id: string
  background?: string
  elements: PPTElement[]
}

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
 * 画布常量
 */
export const CANVAS_WIDTH = 1000
export const CANVAS_HEIGHT = 562.5
