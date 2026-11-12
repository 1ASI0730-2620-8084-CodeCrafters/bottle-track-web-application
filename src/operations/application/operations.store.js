import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const useOperationsStore = defineStore('operations', () => {
    const deliveryOrders = ref([]);
    const isLoading = ref(false);
    const loadError = ref(false);
    const isReporting = ref(false);
    const isTrackingComingSoon = ref(true);

    const activeDeliveryOrders = computed(() => []);
    const registeredDeliveryOrders = computed(() => []);

    async function fetchDeliveryOrders() {
        deliveryOrders.value = [];
        isLoading.value = false;
        loadError.value = false;
    }

    async function reportReceptionProblem() {
        return false;
    }

    return {
        deliveryOrders,
        activeDeliveryOrders,
        registeredDeliveryOrders,
        isLoading,
        loadError,
        isReporting,
        isTrackingComingSoon,
        fetchDeliveryOrders,
        reportReceptionProblem
    };
});

export default useOperationsStore;
