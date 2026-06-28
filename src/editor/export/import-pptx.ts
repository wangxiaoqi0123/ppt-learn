import JSZip from 'jszip'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement, PPTTextElement, PPTShapeElement } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'

/**
 * EMU（English Metric Units）转画布像素
 * 1 英寸 = 914400 EMU
 * PPT 页面 10 英寸宽 对应画布 1000px
 */
const EMU_PER_INCH = 914400
const PPT_WIDTH_INCH = 10
const PPT_HEIGHT_INCH = 5.625

function emuToCanvasX(emu: number): number {
  return (emu / EMU_PER_INCH / PPT_WIDTH_INCH) * CANVAS_WIDTH
}

function emuToCanvasY(emu: number): number {
  return (emu / EMU_PER_INCH / PPT_HEIGHT_INCH) * CANVAS_HEIGHT
}

/**
 * 解析颜色节点
 */
function parseColor(node: Element): string {
  // srgbClr
  const srgb = node.querySelector('srgbClr')
  if (srgb) {
    return '#' + srgb.getAttribute('val')
  }
  // schemeClr 映射（简化）
  const scheme = node.querySelector('schemeClr')
  if (scheme) {
    const schemeMap: Record<string, string> = {
      'accent1': '#4472C4',
      'accent2': '#ED7D31',
      'accent3': '#A5A5A5',
      'accent4': '#FFC000',
      'accent5': '#5B9BD5',
      'accent6': '#70AD47',
      'dk1': '#000000',
      'dk2': '#44546A',
      'lt1': '#FFFFFF',
      'lt2': '#E7E6E6',
      'tx1': '#000000',
      'tx2': '#44546A',
      'bg1': '#FFFFFF',
      'bg2': '#E7E6E6',
    }
    return schemeMap[scheme.getAttribute('val') || ''] || '#333333'
  }
  return '#333333'
}

/**
 * 解析形状的填充颜色
 */
function parseFill(spPr: Element): string | undefined {
  const solidFill = spPr.querySelector('solidFill')
  if (solidFill) {
    return parseColor(solidFill)
  }
  return undefined
}

/**
 * 从文本框/形状中提取文本内容
 */
function extractText(txBody: Element | null): string {
  if (!txBody) return ''
  const paragraphs: string[] = []
  txBody.querySelectorAll('p').forEach(p => {
    const runs: string[] = []
    p.querySelectorAll('r').forEach(r => {
      const t = r.querySelector('t')
      if (t && t.textContent) {
        runs.push(t.textContent)
      }
    })
    paragraphs.push(runs.join(''))
  })
  return paragraphs.join('\n')
}

/**
 * 解析文本样式
 */
function parseTextStyle(txBody: Element | null): Partial<PPTTextElement> {
  const style: Partial<PPTTextElement> = {}
  if (!txBody) return style

  // 取第一个 run 的属性
  const rPr = txBody.querySelector('r > rPr')
  if (rPr) {
    const sz = rPr.getAttribute('sz')
    if (sz) {
      // sz 单位是百分之一磅
      style.fontSize = Math.round(parseInt(sz) / 100)
    }
    if (rPr.getAttribute('b') === '1') {
      style.fontWeight = 'bold'
    }
    const solidFill = rPr.querySelector('solidFill')
    if (solidFill) {
      style.color = parseColor(solidFill)
    }
  }

  // 段落对齐
  const pPr = txBody.querySelector('p > pPr')
  if (pPr) {
    const algn = pPr.getAttribute('algn')
    if (algn === 'ctr') style.textAlign = 'center'
    else if (algn === 'r') style.textAlign = 'right'
    else style.textAlign = 'left'
  }

  return style
}

/**
 * 判断形状是否是圆形
 */
function getShapeType(spPr: Element): 'rect' | 'circle' | 'roundedRect' {
  const prstGeom = spPr.querySelector('prstGeom')
  if (prstGeom) {
    const prst = prstGeom.getAttribute('prst')
    if (prst === 'ellipse') return 'circle'
    if (prst === 'roundRect') return 'roundedRect'
  }
  return 'rect'
}

/**
 * 解析单张幻灯片 XML
 */
function parseSlideXml(xmlStr: string): PPTElement[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'application/xml')
  const elements: PPTElement[] = []

  // 查找所有 sp（shape）节点
  const shapes = doc.querySelectorAll('sp')
  shapes.forEach(sp => {
    try {
      const spPr = sp.querySelector('spPr')
      if (!spPr) return

      // 获取位置和尺寸
      const off = spPr.querySelector('off')
      const ext = spPr.querySelector('ext')
      if (!off || !ext) return

      const x = parseInt(off.getAttribute('x') || '0')
      const y = parseInt(off.getAttribute('y') || '0')
      const cx = parseInt(ext.getAttribute('cx') || '0')
      const cy = parseInt(ext.getAttribute('cy') || '0')

      const left = emuToCanvasX(x)
      const top = emuToCanvasY(y)
      const width = emuToCanvasX(cx)
      const height = emuToCanvasY(cy)

      // 检查是否有文本
      const txBody = sp.querySelector('txBody')
      const text = extractText(txBody)
      const fill = parseFill(spPr)

      if (text && text.trim()) {
        // 文本元素
        const textStyle = parseTextStyle(txBody)
        const element: PPTTextElement = {
          id: nanoid(),
          type: 'text',
          left,
          top,
          width,
          height,
          content: text,
          fontSize: textStyle.fontSize || 24,
          color: textStyle.color || '#333333',
          fontWeight: textStyle.fontWeight,
          textAlign: textStyle.textAlign || 'left',
        }
        elements.push(element)
      } else if (fill) {
        // 形状元素
        const shapeType = getShapeType(spPr)
        const element: PPTShapeElement = {
          id: nanoid(),
          type: 'shape',
          shape: shapeType,
          left,
          top,
          width,
          height,
          fill,
        }
        elements.push(element)
      }
    } catch (err) {
      console.warn('Failed to parse shape:', err)
    }
  })

  return elements
}

/**
 * 解析幻灯片背景
 */
function parseSlideBackground(xmlStr: string): string | undefined {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'application/xml')

  const bg = doc.querySelector('bg')
  if (bg) {
    const solidFill = bg.querySelector('solidFill')
    if (solidFill) {
      return parseColor(solidFill)
    }
  }
  return undefined
}

/**
 * 导入 PPTX 文件，解析为 Slide[]
 */
export async function importFromPPTX(file: File): Promise<Slide[]> {
  const zip = await JSZip.loadAsync(file)
  const slides: Slide[] = []

  // 获取所有幻灯片文件（按顺序）
  const slideFiles: string[] = []
  zip.folder('ppt/slides')?.forEach((relativePath) => {
    if (relativePath.match(/^slide\d+\.xml$/)) {
      slideFiles.push('ppt/slides/' + relativePath)
    }
  })

  // 按数字排序
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
    return numA - numB
  })

  for (const slidePath of slideFiles) {
    const xmlStr = await zip.file(slidePath)?.async('string')
    if (!xmlStr) continue

    const elements = parseSlideXml(xmlStr)
    const background = parseSlideBackground(xmlStr)

    slides.push({
      id: nanoid(),
      background: background || '#ffffff',
      elements,
    })
  }

  return slides
}
