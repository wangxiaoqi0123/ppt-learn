import { ref } from 'vue'
import { nanoid } from 'nanoid'
import type { PPTElement } from '../models'
import { editorStore } from '../store'

/**
 * 剪贴板管理
 */
const clipboard = ref<PPTElement[]>([])

/** 复制选中的元素 */
export function copy() {
  const elements = editorStore.selectedElements.value
  if (elements.length === 0) return
  clipboard.value = JSON.parse(JSON.stringify(elements))
}

/** 粘贴元素（偏移 20px 防止重叠） */
export function paste() {
  if (clipboard.value.length === 0) return

  const newIds: string[] = []
  clipboard.value.forEach(el => {
    const newElement = {
      ...el,
      id: nanoid(),
      left: el.left + 20,
      top: el.top + 20,
    }
    editorStore.addElement(newElement)
    newIds.push(newElement.id)
  })

  editorStore.selectElement(newIds)
}

/** 剪切 */
export function cut() {
  copy()
  editorStore.deleteSelectedElements()
}
