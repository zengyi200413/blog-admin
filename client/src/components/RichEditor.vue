<script setup>
import { onBeforeUnmount, shallowRef } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue"]);
const editorRef = shallowRef();

const toolbarConfig = {};
const editorConfig = {
  placeholder: "写点值得发布的内容..."
};

function handleCreated(editor) {
  editorRef.value = editor;
}

function handleChange(editor) {
  emit("update:modelValue", editor.getHtml());
}

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy();
  }
});
</script>

<template>
  <div class="editor-shell">
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
    <Editor
      class="editor-body"
      :model-value="modelValue"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>
