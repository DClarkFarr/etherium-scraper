<script setup>
import client from "@/utils/client";
import { onMounted, ref, nextTick } from "vue";
import { concatAddress } from "@/methods/address";
import { useRouter } from "vue-router";
import BasicButton from "../components/button/BasicButton.vue";
import { useToast } from "vue-toastification";
import RawTransactionsTable from "../components/table/RawTransactionsTable.vue";

const router = useRouter();

const toast = useToast();

const address = ref("");
const loadingAddress = ref(true);

const transactions = ref([]);
const loadingTransactions = ref(false);
const transactionsLoaded = ref(false);

const loadAddress = () => {
    return client
        .get("/address")
        .then(({ data }) => {
            address.value = data.address;
            loadingAddress.value = false;
        })
        .catch((error) => {
            router.push("/");
        });
};

const loadTransactions = () => {
    loadingTransactions.value = true;
    return client
        .get("/transactions", { params: { address: address.value } })
        .then(({ data }) => {
            transactions.value = data.transactions;

            console.log("set stuff", transactions.value);

            transactionsLoaded.value = true;
        })
        .catch((err) => {
            console.log(err);
            toast.error(err.response?.data?.message || err.message);
        })
        .finally(() => {
            loadingTransactions.value = false;
        });
};

onMounted(async () => {
    await loadAddress();
    await nextTick();
    if (address.value) {
        await loadTransactions();
    }
});
</script>
<template>
    <div class="w-[600px] max-w-full">
        <h1 class="font-bold text-2xl mb-6">
            Address
            <small>
                <template v-if="loadingAddress"> Loading... </template>
                <template v-else>
                    {{ concatAddress(address) }}
                </template>
            </small>
        </h1>

        <div class="rounded-lg p-10 bg-white">
            <template v-if="transactionsLoaded">
                <RawTransactionsTable :rows="transactions" :address="address" />
            </template>
            <template v-else>
                <BasicButton
                    class="bg-gray-700 hover:bg-gray-900"
                    :loading="loadingTransactions"
                    @click="loadTransactions"
                >
                    Load Transactions
                </BasicButton>
            </template>
        </div>
    </div>
</template>
