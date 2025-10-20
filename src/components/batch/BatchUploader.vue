<script setup lang="ts">
import { ref } from 'vue'
import { NUpload, NUploadDragger, NText, NP, NIcon, type UploadFileInfo } from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'

const emit = defineEmits<{
  filesSelected: [File[]]
}>()

const fileList = ref<UploadFileInfo[]>([])

function handleChange({ fileList: newFileList }: { fileList: UploadFileInfo[] }) {
  fileList.value = newFileList
  const files = newFileList.map(item => item.file).filter(Boolean) as File[]
  if (files.length > 0) {
    emit('filesSelected', files)
  }
}
</script>

<template>
  <n-upload
    multiple
    directory-dnd
    accept="image/*"
    :max="50"
    :file-list="fileList"
    @change="handleChange"
    :default-upload="false"
  >
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <cloud-upload-outline />
        </n-icon>
      </div>
      <n-text style="font-size: 16px">
        Click or drag images to this area to upload
      </n-text>
      <n-p depth="3" style="margin: 8px 0 0 0">
        Upload multiple scanned images (max 50 files)
      </n-p>
    </n-upload-dragger>
  </n-upload>
</template>
