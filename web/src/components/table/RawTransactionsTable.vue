<script setup>
import { toCurrency, toDateTime } from "@/methods/format";
import { computed } from "vue";

const props = defineProps({
    address: {
        type: String,
    },
    rows: {
        type: Array,
    },
});

const computedRows = computed(() => {
    return props.rows.filter((r) => {
        if (!r.asset) {
            return false;
        }

        return true;
    });
});
</script>

<template>
    <table class="table w-full">
        <thead>
            <tr>
                <th class="text-left">In/Out</th>
                <th class="text-left">Asset</th>
                <th class="text-left">Value</th>
                <th class="text-left">Date</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="r in computedRows" :key="r.hash">
                <td>
                    <span
                        class="text-red-700"
                        v-if="r.from === address.toLowerCase()"
                        >Out</span
                    >
                    <span class="text-emerald-700" v-else>In</span>
                </td>
                <td>{{ r.asset }}</td>
                <td>{{ r.value }}</td>
                <td>{{ toDateTime(r.timestamp) }}</td>
            </tr>
        </tbody>
    </table>
</template>
