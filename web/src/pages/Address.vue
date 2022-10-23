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

const assetTransactions = computed(() => {
    const selectedKeys = selectedAssets.value;
    if (selectedKeys.length === 0) {
        return transactions.value;
    }

    let f = transactions.value.filter((t) => selectedKeys.includes(t.asset));

    return f;
});

const assetTransactionRecipients = computed(() => {
    return assetTransactions.value.reduce((acc, row) => {
        if (!acc[row.to]) {
            acc[row.to] = 0;
        }

        acc[row.to]++;

        return acc;
    }, {});
});

const assetTransactionSenders = computed(() => {
    return assetTransactions.value.reduce((acc, row) => {
        if (!acc[row.from]) {
            acc[row.from] = 0;
        }

        acc[row.from]++;

        return acc;
    }, {});
});

const assetRecipientOptions = computed(() => {
    return Object.entries(assetTransactionRecipients.value).map(
        ([key, val]) => ({
            label: `${concatAddress(key)} (${val})`,
            value: key,
        })
    );
});

const assetSenderOptions = computed(() => {
    return Object.entries(assetTransactionSenders.value).map(([key, val]) => ({
        label: `${concatAddress(key)} (${val})`,
        value: key,
    }));
});

const includeRecipients = useStorage(
    `address-${address.value}--include-recipients`,
    []
);

const includeSenders = useStorage(
    `address-${address.value}--include-senders`,
    []
);

const excludeRecipients = useStorage(
    `address-${address.value}--exclude-recipients`,
    []
);

const excludeSenders = useStorage(
    `address-${address.value}--exclude-senders`,
    []
);

const allFilteredTransactions = computed(() => {
    const iRecipeints = includeRecipients.value.map((r) => r.value);
    const iSenders = includeSenders.value.map((r) => r.value);

    const eRecipeints = excludeRecipients.value.map((r) => r.value);
    const eSenders = excludeSenders.value.map((r) => r.value);

    return [...assetTransactions.value].filter((t) => {
        const hasIRecipients = iRecipeints.length > 0;
        const hasISenders = iSenders.length > 0;

        /**
         * If no recipients/senders are included we don't filter.
         * If filters exist, must match one or the other.
         */
        let status = true;
        if (hasIRecipients || hasISenders) {
            let has = false;
            if (hasIRecipients) {
                if (iRecipeints.includes(t.to)) {
                    has = true;
                }
            }
            if (hasISenders) {
                if (iSenders.includes(t.from)) {
                    has = true;
                }
            }

            status = has;
        }

        /**
         * If excluded recipents/senders are selected, override + exclude row for sure.
         */
        if (eRecipeints.includes(t.to)) {
            status = false;
        }

        if (eSenders.includes(t.from)) {
            status = false;
        }

        return status;
    });
});

const allFilteredTotals = computed(() => {
    const totals = allFilteredTransactions.value.reduce((acc, row) => {
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

const onDownload = () => {
    const rows = [];
    rows.push(["Date", "Hash", "From", "To", "Asset", "Value"]);

    allFilteredTransactions.value.forEach((t) => {
        rows.push([t.timestamp, t.hash, t.from, t.to, t.asset, t.value]);
    });

    rows.push(["", "", "", "", "", ""]);

    rows.push(["Asset", "In", "Out", "Net"]);

    allFilteredTotals.value.forEach((t) => {
        rows.push([t.asset, t.in, t.out, t.net]);
    });

    download(rows, `${address.value}-transactions.csv`);
};

const download = function (data, filename) {
    // Creating a Blob for having a csv file format
    // and passing the data with type
    const blob = new Blob([toCsv(data)], { type: "text/csv" });

    // Creating an object for downloading url
    const url = window.URL.createObjectURL(blob);

    // Creating an anchor(a) tag of HTML
    const a = document.createElement("a");

    // Passing the blob downloading url
    a.setAttribute("href", url);

    // Setting the anchor tag attribute for downloading
    // and passing the download file name
    a.setAttribute("download", filename);

    // Performing a download with click
    a.click();
};

const toCsv = function (data) {
    return data.map((row) => row.join(",")).join("\n");
};

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

                    <div class="flex gap-x-4">
                        <div class="w-1/2 mb-4">
                            <label>Include Recipient</label>
                            <Select
                                v-model="includeRecipients"
                                :multiple="true"
                                class="select"
                                placeholder="Recipients"
                                :options="assetRecipientOptions"
                            >
                            </Select>
                        </div>
                        <div class="w-1/2 mb-4">
                            <label>Include Sender</label>
                            <Select
                                v-model="includeSenders"
                                :multiple="true"
                                class="select"
                                placeholder="Senders"
                                :options="assetSenderOptions"
                            >
                            </Select>
                        </div>
                    </div>
                    <div class="flex gap-x-4">
                        <div class="w-1/2 mb-4">
                            <label>Exclude Recipient</label>
                            <Select
                                v-model="excludeRecipients"
                                :multiple="true"
                                class="select"
                                placeholder="Recipients"
                                :options="assetRecipientOptions"
                            >
                            </Select>
                        </div>
                        <div class="w-1/2 mb-4">
                            <label>Exclude Sender</label>
                            <Select
                                v-model="excludeSenders"
                                :multiple="true"
                                class="select"
                                placeholder="Senders"
                                :options="assetSenderOptions"
                            >
                            </Select>
                        </div>
                    </div>
                </div>
                <Panel :title="`All transactions (${transactions.length})`">
                    <RawTransactionsTable
                        :rows="transactions"
                        :address="address"
                    />
                </Panel>
                <Panel
                    :title="`Selected transactions (${allFilteredTransactions.length})`"
                    :show="true"
                >
                    <RawTransactionsTable
                        :rows="allFilteredTransactions"
                        :address="address"
                    />
                </Panel>
                <Panel
                    :title="`Totals by asset (${allFilteredTotals.length})`"
                    :show="true"
                >
                    <table class="w-full mb-4">
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
                                v-for="total in allFilteredTotals"
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

                    <button
                        class="btn bg-emerald-700 hover:bg-emerald-900"
                        @click="onDownload"
                    >
                        <i class="fa fa-download"></i>
                        Download CSV
                    </button>
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
