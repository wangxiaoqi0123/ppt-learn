import { parse } from 'pptxtojson'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement, PPTTextElement, PPTShapeElement, PPTImageElement } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'

/**
 * 将 pptxtojson 输出的 pt 单位转为画布像素
 * pptxtojson 输出尺寸基于 size.width / size.height (pt)
 * 我们的画布是 CANVAS_WIDTH x CANVAS_HEIGHT (px)
 */
function ptToCanvasX(pt: number, slideWidth: number): number {
  return (pt / slideWidth) * CANVAS_WIDTH
}

function ptToCanvasY(pt: number, slideHeight: number): number {
  return (pt / slideHeight) * CANVAS_HEIGHT
}

/**
 * 解析填充颜色，返回 CSS 颜色字符串或 undefined
 */
function parseFillColor(fill: any): string | undefined {
  if (!fill) return undefined
  if (fill.type === 'color' && fill.value) {
    return fill.value
  }
  // gradient / image 暂时忽略，返回渐变的第一个色或 undefined
  if (fill.type === 'gradient' && fill.colors?.length) {
    return fill.colors[0].color
  }
  return undefined
}

/**
 * 从 HTML 富文本中提取纯文本（简单实现）
 */
function htmlToPlainText(html: string): string {
  // 用 DOMParser 解析 HTML
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * 从 HTML content 中提取字号（取第一个出现的 font-size）
 */
function extractFontSize(html: string): number | undefined {
  const match = html.match(/font-size:\s*([\d.]+)\s*pt/)
  if (match) return Math.round(parseFloat(match[1]))
  return undefined
}

/**
 * 从 HTML content 中提取颜色（取第一个出现的 color）
 */
function extractColor(html: string): string | undefined {
  const match = html.match(/color:\s*(#[0-9a-fA-F]{3,8})/)
  if (match) return match[1]
  return undefined
}

/**
 * 从 HTML content 中提取对齐方式
 */
function extractTextAlign(html: string): 'left' | 'center' | 'right' | undefined {
  const match = html.match(/text-align:\s*(left|center|right)/)
  if (match) return match[1] as 'left' | 'center' | 'right'
  return undefined
}

/**
 * 从 HTML content 中判断是否加粗
 */
function extractFontWeight(html: string): 'bold' | undefined {
  if (html.includes('font-weight: bold') || html.includes('font-weight:bold') || html.includes('<b>') || html.includes('<strong>')) {
    return 'bold'
  }
  return undefined
}

/**
 * 将 pptxtojson 解析的元素转为我们的模型
 */
function convertElement(el: any, slideWidth: number, slideHeight: number): PPTElement | null {
  const left = ptToCanvasX(el.left ?? 0, slideWidth)
  const top = ptToCanvasY(el.top ?? 0, slideWidth)
  const width = ptToCanvasX(el.width ?? 0, slideWidth)
  const height = ptToCanvasY(el.height ?? 0, slideHeight)
  const rotate = el.rotate ?? 0

  if (el.type === 'text' || (el.type === 'shape' && el.content)) {
    const content = el.content || ''
    const plainText = htmlToPlainText(content)
    if (!plainText.trim()) {
      // 如果是 shape 且无文本，当作形状处理
      if (el.type === 'shape') {
        const fill = parseFillColor(el.fill)
        if (fill) {
          const shape: PPTShapeElement = {
            id: nanoid(),
            type: 'shape',
            shape: mapShapeType(el.shapType),
            left,
            top,
            width,
            height,
            rotate,
            fill,
            borderColor: el.borderColor,
            borderWidth: el.borderWidth,
          }
          return shape
        }
      }
      return null
    }

    const textEl: PPTTextElement = {
      id: nanoid(),
      type: 'text',
      left,
      top,
      width,
      height,
      rotate,
      content: plainText,
      fontSize: extractFontSize(content) || 24,
      color: extractColor(content) || '#333333',
      fontWeight: extractFontWeight(content),
      textAlign: extractTextAlign(content) || 'left',
    }
    return textEl
  }

  if (el.type === 'shape') {
    const fill = parseFillColor(el.fill)
    const shape: PPTShapeElement = {
      id: nanoid(),
      type: 'shape',
      shape: mapShapeType(el.shapType),
      left,
      top,
      width,
      height,
      rotate,
      fill,
      borderColor: el.borderColor,
      borderWidth: el.borderWidth,
    }
    return shape
  }

  if (el.type === 'image') {
    const src = el.base64 || el.blob || ''
    if (!src) return null
    const img: PPTImageElement = {
      id: nanoid(),
      type: 'image',
      left,
      top,
      width,
      height,
      rotate,
      src,
    }
    return img
  }

  // table / chart / video / audio / diagram / group 等暂不处理
  return null
}

/**
 * 映射 pptxtojson 的 shapType 到我们的形状类型
 */
function mapShapeType(shapType: string | undefined): 'rect' | 'circle' | 'roundedRect' {
  if (!shapType) return 'rect'
  if (shapType === 'ellipse') return 'circle'
  if (shapType === 'roundRect') return 'roundedRect'
  return 'rect'
}

/**
 * 导入 PPTX 文件，解析为 Slide[]
 */
export async function importFromPPTX(file: File): Promise<Slide[]> {
  const arrayBuffer = await file.arrayBuffer()

  const result = await parse(arrayBuffer, {
    imageMode: 'base64',
    videoMode: 'none',
    audioMode: 'none',
  })

  const slideWidth = result.size?.width || 960
  const slideHeight = result.size?.height || 540

  const slides: Slide[] = (result.slides || []).map((s: any) => {
    const background = parseFillColor(s.fill) || '#ffffff'

    const elements: PPTElement[] = (s.elements || [])
      .map((el: any) => convertElement(el, slideWidth, slideHeight))
      .filter((el: PPTElement | null): el is PPTElement => el !== null)

    return {
      id: nanoid(),
      background,
      elements,
    }
  })

  return slides
}
