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

const selectedRecipients = useStorage(
    `address-${address.value}--selected-recipients`,
    []
);

const selectedTransactions = computed(() => {
    const selectedKeys = selectedAssets.value;
    let f = transactions.value.filter((t) => selectedKeys.includes(t.asset));

    if (selectedRecipients.value.length) {
        const recipientAddresses = selectedRecipients.value.map((r) => r.value);
        console.log("recipientAddresses", recipientAddresses, "in", [...f]);
        f = f.filter(
            (t) =>
                recipientAddresses.includes(t.to) ||
                recipientAddresses.includes(t.from)
        );
    }
    return f;
});

const selectedTotals = computed(() => {
    const totals = selectedTransactions.value.reduce((acc, row) => {
        if (!row.asset) {
            return acc;
        }

        if (!acc[row.asset]) {
            acc[row.asset] = {
                in: 0,
                out: 0,
                net: 0,
            };
        }

        if (address.value.toLowerCase() === row.from) {
            acc[row.asset].out += row.value;
        } else {
            acc[row.asset].in += row.value;
        }

        acc[row.asset].net = acc[row.asset].in - acc[row.asset].out;

        return acc;
    }, {});

    return Object.entries(totals).map(([key, val]) => ({ ...val, asset: key }));
});

const recipients = computed(() => {
    return transactions.value.reduce((acc, row) => {
        if (!acc[row.from]) {
            acc[row.from] = {
                sent: 0,
                received: 0,
            };
        }
        if (!acc[row.to]) {
            acc[row.to] = {
                sent: 0,
                received: 0,
            };
        }

        acc[row.to].received++;
        acc[row.from].sent++;

        return acc;
    }, {});
});

const recipientOptions = computed(() => {
    return Object.entries(recipients.value).map(([key, val]) => ({
        label: `${concatAddress(key)} Sent ${val.sent}, Rec ${val.received}`,
        value: key,
    }));
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
    <div class="w-[900px] max-w-full">
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
                    <div class="mb-4">
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
                    <div class="mb-4">
                        <label>Filter by address</label>
                        <Select
                            v-model="selectedRecipients"
                            :multiple="true"
                            class="select"
                            placeholder="Recipients"
                            :options="recipientOptions"
                        >
                        </Select>
                    </div>
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
                <Panel :title="`Totals by asset (${selectedTotals.length})`">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left">Asset</th>
                                <th class="text-left">In</th>
                                <th class="text-left">Out</th>
                                <th class="text-left">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="total in selectedTotals"
                                :key="total.asset"
                            >
                                <td>{{ total.asset }}</td>
                                <td class="text-emerald-700">
                                    {{ total.in.toFixed(4) }}
                                </td>
                                <td class="text-red-700">
                                    {{ total.out.toFixed(4) }}
                                </td>
                                <td
                                    :class="{
                                        'text-emerald-700': total.net >= 0,
                                        'text-red-700': total.net < 0,
                                    }"
                                >
                                    {{ total.net.toFixed(4) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
