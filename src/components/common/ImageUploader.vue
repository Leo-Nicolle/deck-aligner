<script setup lang="ts">
import { ref } from 'vue'
import { NUpload, NUploadDragger, NText, NP, NIcon, type UploadFileInfo } from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'

const emit = defineEmits<{
  fileSelected: [File]
}>()

const fileList = ref<UploadFileInfo[]>([])

function handleChange({ fileList: newFileList }: { fileList: UploadFileInfo[] }) {
  fileList.value = newFileList
  if (newFileList.length > 0 && newFileList[0].file) {
    emit('fileSelected', newFileList[0].file)
  }
}
</script>

<template>
  <n-upload
    accept="image/*"
    :max="1"
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
        Click or drag an image to this area to upload
      </n-text>
      <n-p depth="3" style="margin: 8px 0 0 0">
        Upload a scanned image containing playing cards
      </n-p>
    </n-upload-dragger>
  </n-upload>
</template>
