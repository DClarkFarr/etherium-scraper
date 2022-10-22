<script setup>
import { watch, reactive, ref } from "vue";

const emit = defineEmits(["update:show", "open", "close"]);

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: "",
    },
});

const internalShow = ref(props.show);

const open = () => {
    internalShow.value = true;
    emit("open");
};

const close = () => {
    internalShow.value = false;
    emit("close");
};

const toggle = () => {
    internalShow.value ? close() : open();
};

const stateProps = reactive({
    show: internalShow.value,
    open,
    close,
    toggle,
});

watch(
    () => props.show,
    (val) => {
        internalShow.value = val;
    }
);
</script>

<template>
    <div class="panel" :class="{ show: internalShow }">
        <div
            class="panel__header border-b border-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            @click="toggle"
        >
            <slot name="header" v-bind="stateProps">
                <div class="flex items-center w-full px-6 py-3">
                    <div class="panel__title grow">
                        <slot name="title" v-bind="stateProps">
                            <h2 class="text-xl font-semibold">
                                {{ title }}
                            </h2>
                        </slot>
                    </div>
                    <div class="panel__arrow shrink">
                        <slot name="arrow" v-bind="stateProps">
                            <i
                                class="fa fa-caret-down"
                                :class="{ 'fa-rotate-90': !internalShow }"
                            ></i>
                        </slot>
                    </div>
                </div>
            </slot>
        </div>
        <div class="panel__body p-6" v-show="internalShow">
            <slot v-bind="stateProps">
                <div>Default content</div>
            </slot>
        </div>
    </div>
</template>
