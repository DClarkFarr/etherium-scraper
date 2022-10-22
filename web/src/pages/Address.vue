<script setup>
import client from "@/utils/client";
import { onMounted, ref, nextTick, computed } from "vue";
import { concatAddress } from "@/methods/address";
import { useRouter } from "vue-router";
import BasicButton from "../components/button/BasicButton.vue";
import { useToast } from "vue-toastification";
import RawTransactionsTable from "../components/table/RawTransactionsTable.vue";
import Panel from "../components/controls/Panel.vue";
import { useStorage } from "@vueuse/core";

const router = useRouter();

const toast = useToast();

const address = ref("");
const loadingAddress = ref(true);

const transactions = ref([]);
const loadingTransactions = ref(false);
const transactionsLoaded = ref(false);

const assets = computed(() =>
    transactions.value.reduce((acc, row) => {
        if (!row.asset) {
            return acc;
        }

        if (!acc[row.asset]) {
            acc[row.asset] = 0;
        }
        acc[row.asset]++;

        return acc;
    }, {})
);

const assetOptions = computed(() => {
    const arr = Object.keys(assets.value).map((asset) => {
        return {
            label: asset + " (" + assets.value[asset] + ")",
            value: asset,
        };
    });

    return arr;
});

const selectedAssets = useStorage(
    `address-${address.value}--selected-assets`,
    []
);

const selectedTransactions = computed(() => {
    const selectedKeys = selectedAssets.value;
    return transactions.value.filter((t) => selectedKeys.includes(t.asset));
});

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
        .then(async ({ data }) => {
            transactions.value = data.transactions;

            transactionsLoaded.value = true;

            await nextTick();

            if (!selectedAssets.value.length) {
                selectedAssets.value = Object.keys(assets.value);
            }
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
                <div class="filters mb-6">
                    <div>
                        <label>
                            Filter Assets

                            <span
                                class="text-red-600 pl-2 cursor-pointer hover:underline"
                                @click="selectedAssets = []"
                            >
                                <i class="fa fa-times"></i> Clear All
                            </span>
                        </label>
                        <Select
                            v-model="selectedAssets"
                            :multiple="true"
                            class="select"
                            placeholder="Filter assets"
                            :options="assetOptions"
                        >
                        </Select>
                    </div>
                    <div></div>
                    <div></div>
                </div>
                <Panel :title="`All transactions (${transactions.length})`">
                    <RawTransactionsTable
                        :rows="transactions"
                        :address="address"
                    />
                </Panel>
                <Panel
                    :title="`Selected transactions (${selectedTransactions.length})`"
                    :show="true"
                >
                    <RawTransactionsTable
                        :rows="selectedTransactions"
                        :address="address"
                    />
                </Panel>
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

<style lang="scss" scoped>
.select {
    @apply w-full;
}
</style>
