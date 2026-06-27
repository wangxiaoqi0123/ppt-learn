import type { Slide, PPTTextElement, PPTShapeElement, PPTElement } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'

/**
 * 画布坐标转换为 PPTX 英寸坐标
 * 画布基准 1000x562.5 对应 PPT 的 10x5.625 英寸
 */
function toInches(px: number, base: number, inchBase: number): number {
  return (px / base) * inchBase
}

/**
 * 颜色转换：#RRGGBB -> RRGGBB
 */
function toColor(color?: string): string {
  if (!color) return '333333'
  return color.replace('#', '')
}

/**
 * 导出为 PPTX 文件
 */
export async function exportToPPTX(
  slides: Slide[],
  filename: string = 'presentation.pptx'
): Promise<boolean> {
  try {
    const PptxGenJS = await import('pptxgenjs')
    const pptx = new PptxGenJS.default()

    pptx.layout = 'LAYOUT_16x9'
    pptx.author = 'PPTist Demo'
    pptx.title = 'Presentation'

    const PPT_W = 10      // PPT 宽度（英寸）
    const PPT_H = 5.625   // PPT 高度（英寸）

    for (const slide of slides) {
      const pptxSlide = pptx.addSlide()

      // 背景
      if (slide.background) {
        pptxSlide.background = { color: toColor(slide.background) }
      }

      // 元素
      for (const element of slide.elements) {
        const x = toInches(element.left, CANVAS_WIDTH, PPT_W)
        const y = toInches(element.top, CANVAS_HEIGHT, PPT_H)
        const w = toInches(element.width, CANVAS_WIDTH, PPT_W)
        const h = toInches(element.height, CANVAS_HEIGHT, PPT_H)

        if (element.type === 'text') {
          const el = element as PPTTextElement
          pptxSlide.addText(el.content, {
            x, y, w, h,
            fontSize: el.fontSize ? Math.round(el.fontSize * 0.6) : 14,
            color: toColor(el.color),
            bold: el.fontWeight === 'bold',
            align: el.textAlign || 'left',
            valign: 'middle',
            rotate: element.rotate || 0,
          })
        } else if (element.type === 'shape') {
          const el = element as PPTShapeElement
          const shapeType = el.shape === 'circle' ? 'ellipse' : 'rect'

          pptxSlide.addShape(shapeType, {
            x, y, w, h,
            fill: { color: toColor(el.fill) },
            line: el.borderColor
              ? { color: toColor(el.borderColor), width: el.borderWidth || 1 }
              : undefined,
            rectRadius: el.shape === 'roundedRect' ? 0.1 : undefined,
            rotate: element.rotate || 0,
          })
        }
      }
    }

    await pptx.writeFile({ fileName: filename })
    return true
  } catch (error) {
    console.error('Export PPTX failed:', error)
    return false
  }
}
