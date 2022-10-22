<script setup>
import { computed } from "vue";
import { toDateTime } from "@/methods/format";
import { concatAddress } from "@/methods/address";

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
                <th class="text-left">Address</th>
                <th class="text-left">In/Out</th>
                <th class="text-left">Asset</th>
                <th class="text-left">Value</th>
                <th class="text-left">Date</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="r in computedRows" :key="r.hash" :data-has="r.hash">
                <td class="leading-none">
                    <div class="text-red-700">
                        <small>{{ concatAddress(r.from) }}</small>
                    </div>
                    <div class="text-emerald-700">
                        <small>{{ concatAddress(r.to) }}</small>
                    </div>
                </td>
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

<style lang="scss" scoped>
td {
    padding: 0.25rem 0;
}
</style>
