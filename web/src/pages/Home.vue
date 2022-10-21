<script setup>
import AddressForm from "../components/form/AddressForm.vue";
import client from "@/utils/client.js";
import { useRouter } from "vue-router";

const router = useRouter();

const onSubmit = (address) => {
    client
        .post("/address", { address })
        .then(() => {
            router.push("/address");
        })
        .catch((error) => {
            console.log(error);
        });
};
</script>

<template>
    <div class="flex flex-col items-center">
        <h1 class="text-4xl font-bold mb-6">Welcome to EtheriumScan</h1>
        <AddressForm @submit="onSubmit" />
    </div>
</template>
