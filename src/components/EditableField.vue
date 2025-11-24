<template>
    <div class="editable-field">
        <v-text-field v-if="editing" v-model="editValue" :label="label" :type="type" :rules="rules" variant="outlined"
            density="compact" @keyup.enter="saveValue" @keyup.escape="cancelEdit" autofocus>
            <template #append-inner>
                <v-btn icon="mdi-check" size="small" variant="text" @click="saveValue" />
                <v-btn icon="mdi-close" size="small" variant="text" @click="cancelEdit" />
            </template>
        </v-text-field>

        <div v-else class="field-display">
            <span class="field-label">{{ label }}:</span>
            <span class="field-value">{{ displayValue || '未设置' }}</span>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="startEdit" class="edit-btn" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    label: string
    value: string | null
    type?: string
    rules?: Array<(v: string) => boolean | string>
    nullable?: boolean
}

interface Emits {
    (e: 'update:value', value: string | null): void
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    rules: () => [],
    nullable: false
})

const emit = defineEmits<Emits>()

const editing = ref(false)
const editValue = ref('')

const displayValue = computed(() => {
    if (props.nullable && !props.value) {
        return '未设置'
    }
    return props.value
})

const startEdit = () => {
    editValue.value = props.value || ''
    editing.value = true
}

const saveValue = () => {
    // 验证规则
    const errors = props.rules.map(rule => rule(editValue.value)).filter(result => result !== true)
    if (errors.length > 0) {
        return
    }

    const newValue = editValue.value.trim() || (props.nullable ? null : '')
    emit('update:value', newValue)
    editing.value = false
}

const cancelEdit = () => {
    editing.value = false
    editValue.value = ''
}
</script>

<style scoped>
.editable-field {
    margin-bottom: 16px;
}

.field-display {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    min-height: 56px;
}

.field-label {
    font-weight: 500;
    margin-right: 8px;
    min-width: 80px;
}

.field-value {
    flex: 1;
    color: #666;
}

.edit-btn {
    opacity: 0;
    transition: opacity 0.2s;
}

.field-display:hover .edit-btn {
    opacity: 1;
}
</style>
