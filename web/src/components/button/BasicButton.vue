<script setup>
const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: "button",
    },
});
</script>

<template>
    <button :type="type" class="btn" :disabled="disabled || loading">
        <template v-if="loading"> Saving... </template>
        <template v-else>
            <slot></slot>
        </template>
    </button>
</template>
