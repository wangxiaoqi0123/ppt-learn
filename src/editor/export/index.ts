import { ref } from 'vue'
import type { Slide } from '../models'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../models'

/**
 * 导出 PPT 数据
 */
export function exportSlidesToJSON(slides: Slide[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      slides,
      createdAt: new Date().toISOString(),
      canvasSize: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        ratio: `${CANVAS_WIDTH}:${CANVAS_HEIGHT}`,
      },
    },
    null,
    2
  )
}

/**
 * 导入 PPT 数据
 */
export function importSlidesFromJSON(json: string): Slide[] | null {
  try {
    const data = JSON.parse(json)
    if (!data.slides || !Array.isArray(data.slides)) {
      throw new Error('Invalid PPT format: missing slides array')
    }
    return data.slides
  } catch (error) {
    console.error('Failed to parse PPT JSON:', error)
    return null
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type: string = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 导出为 JSON 文件
 */
export function exportToFile(slides: Slide[], filename: string = 'presentation.json') {
  const json = exportSlidesToJSON(slides)
  downloadFile(json, filename)
}

/**
 * 导出为图片（单个幻灯片截图）
 * 使用 html2canvas 实现（需要安装依赖）
 */
export async function exportSlideToImage(
  slide: Slide,
  element: HTMLElement,
  filename: string = 'slide.png'
): Promise<boolean> {
  try {
    // 动态加载 html2canvas
    const html2canvas = await import('html2canvas')
    const canvas = await html2canvas.default(element, {
      scale: 2,
      backgroundColor: slide.background || '#ffffff',
      useCORS: true,
      allowTaint: true,
    })

    // 将 canvas 转换为 data URL
    const dataURL = canvas.toDataURL('image/png', 1.0)
    
    // 创建下载链接
    const a = document.createElement('a')
    a.href = dataURL
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    return true
  } catch (error) {
    console.error('Failed to export slide to image:', error)
    return false
  }
}

/**
 * 批量导出所有幻灯片为图片
 */
export async function exportAllSlidesToImages(
  slides: Slide[],
  getSlideElement: (index: number) => HTMLElement | null,
  prefix: string = 'slide'
): Promise<number> {
  let successCount = 0
  for (let i = 0; i < slides.length; i++) {
    const element = getSlideElement(i)
    if (!element) continue
    
    const success = await exportSlideToImage(
      slides[i],
      element,
      `${prefix}-${i + 1}.png`
    )
    if (success) successCount++
  }
  return successCount
}

/**
 * 复制 JSON 到剪贴板
 */
export async function copyToClipboard(slides: Slide[]): Promise<boolean> {
  try {
    const json = exportSlidesToJSON(slides)
    await navigator.clipboard.writeText(json)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
