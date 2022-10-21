<script setup>
import BasicButton from "../button/BasicButton.vue";
import { useToast } from "vue-toastification";
import { ref } from "vue";

const toast = useToast();

const emit = defineEmits(["submit"]);

const address = ref("");
const submitting = ref(false);

const onSubmit = () => {
    submitting.value = true;
    setTimeout(() => {
        submitting.value = false;
    }, 1000);
    if (address.value.length < 15 && address.value.indexOf("0x") !== 0) {
        toast.error("Please enter a valid address", {
            timeout: 2000,
        });
        return;
    }

    emit("submit", address.value);
};
</script>

<template>
    <div class="address-form lg:w-[400px]">
        <form @submit.prevent="onSubmit">
            <div class="form-group mb-4">
                <input class="input" placeholder="0x..." v-model="address" />
            </div>
            <div class="form-group">
                <BasicButton
                    type="submit"
                    class="btn bg-gray-700 hover:bg-gray-900"
                    :loading="submitting"
                >
                    Find Address
                </BasicButton>
            </div>
        </form>
    </div>
</template>
