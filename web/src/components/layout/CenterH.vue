<template>
    <div class="center-h relative h-full w-full">
        <div class="absolute max-h-full">
            <div class="max-h-screen">
                <div class="flex justify-center">
                    <div>
                        <slot></slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.absolute {
    top: 50%;
    right: 0;
    left: 0;
    transform: translateY(-50%);
}

.max-h-screen {
    /* overflow-y: auto; */
}
</style>
