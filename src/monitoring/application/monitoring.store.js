import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { currentOrganizationId, currentUserId } from '../../iam/application/iam.facade.js';
import { MonitoringApi } from '../infrastructure/monitoring-api.js';
import { MonitoringAssembler } from '../infrastructure/monitoring.assemblers.js';

const monitoringApi = new MonitoringApi();

function comingSoon() {
    return Promise.resolve('coming-soon');
}

const useMonitoringStore = defineStore('monitoring', () => {
    const organizationId = computed(() => currentOrganizationId());
    const userId = computed(() => currentUserId());
    const monitoredOperations = ref([]);
    const alerts = ref([]);
    const monitoringLoaded = ref(false);
    const isSaving = ref(false);
    const devices = ref([]);
    const devicesLoaded = ref(false);
    const isDashboardComingSoon = ref(true);

    const pendingAlerts = computed(() => alerts.value.filter(alert => !alert.isAcknowledged));

    async function fetchMonitoring() {
        monitoredOperations.value = [];
        alerts.value = [];
        monitoringLoaded.value = true;
    }

    function simulateReading() {
        return Promise.resolve({ alertTypes: [], error: 'coming-soon' });
    }

    async function acknowledgeAlert(alert, acknowledgedBy) {
        if (alert.isAcknowledged) return 'alert-already-acknowledged';
        try {
            const { data } = await monitoringApi.acknowledgeAlert(alert.id, acknowledgedBy);
            alert.acknowledgedBy = data.acknowledgedBy;
            alert.acknowledgedAt = data.acknowledgedAt;
            return null;
        } catch (error) {
            return 'alert-not-acknowledged';
        }
    }

    async function fetchDevices(organizationId) {
        const [{ data: vehicles }, { data: deviceResources }] = await Promise.all([
            monitoringApi.getVehicles(organizationId),
            monitoringApi.getAllDevices()
        ]);
        const vehicleIds = new Set(vehicles.map(vehicle => vehicle.id));
        const orgDevices = deviceResources.filter(device => vehicleIds.has(device.vehicleId));
        devices.value = orgDevices.map(resource => MonitoringAssembler.toDevice(resource, vehicles));
        devicesLoaded.value = true;
    }

    function updateSafeRange() {
        return comingSoon();
    }

    function reportIncidentFromAlert() {
        return comingSoon();
    }

    return {
        organizationId,
        userId,
        devices,
        devicesLoaded,
        fetchDevices,
        updateSafeRange,
        reportIncidentFromAlert,
        monitoredOperations,
        alerts,
        pendingAlerts,
        monitoringLoaded,
        isDashboardComingSoon,
        isSaving,
        fetchMonitoring,
        simulateReading,
        acknowledgeAlert
    };
});

export default useMonitoringStore;
