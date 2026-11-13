import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { currentOrganizationId, currentUserId } from '../../iam/application/iam.facade.js';
import { FleetApi } from '../infrastructure/fleet-api.js';
import { DriverAssembler, VehicleAssembler } from '../infrastructure/fleet.assemblers.js';

const fleetApi = new FleetApi();

const useFleetStore = defineStore('fleet', () => {
    const organizationId = computed(() => currentOrganizationId());
    const userId = computed(() => currentUserId());
    const vehicles = ref([]);
    const drivers = ref([]);
    const vehiclesLoaded = ref(false);
    const driversLoaded = ref(false);
    const isSaving = ref(false);
    const showOnlyAvailableVehicles = ref(false);
    const showOnlyAvailableDrivers = ref(false);

    const visibleVehicles = computed(() => (showOnlyAvailableVehicles.value
        ? vehicles.value.filter(item => item.isAvailable)
        : vehicles.value));

    const visibleDrivers = computed(() => (showOnlyAvailableDrivers.value
        ? drivers.value.filter(item => item.isAvailable)
        : drivers.value));

    async function runSaving(operation) {
        isSaving.value = true;
        try {
            return await operation();
        } catch {
            return 'request-failed';
        } finally {
            isSaving.value = false;
        }
    }

    function replaceById(collection, entity) {
        return collection.map(item => (item.id === entity.id ? entity : item));
    }

    async function fetchVehicles(organizationId) {
        const response = await fleetApi.getVehicles(organizationId);
        vehicles.value = VehicleAssembler.toEntitiesFromResponse(response);
        vehiclesLoaded.value = true;
    }

    function saveVehicle(vehicle) {
        return runSaving(async () => {
            const resource = VehicleAssembler.toResourceFromEntity(vehicle);
            try {
                if (vehicle.id) {
                    const response = await fleetApi.updateVehicle(vehicle.id, resource);
                    vehicles.value = replaceById(vehicles.value, VehicleAssembler.toEntityFromResource(response.data));
                } else {
                    const response = await fleetApi.createVehicle(resource);
                    vehicles.value = vehicles.value.concat([VehicleAssembler.toEntityFromResource(response.data)]);
                }
                return null;
            } catch (error) {
                if (error.response && error.response.status === 409) return 'plate-number-taken';
                return 'request-failed';
            }
        });
    }

    async function fetchDrivers(organizationId) {
        const response = await fleetApi.getDrivers(organizationId);
        drivers.value = DriverAssembler.toEntitiesFromResponse(response);
        driversLoaded.value = true;
    }

    function saveDriver(driver) {
        return runSaving(async () => {
            const resource = DriverAssembler.toResourceFromEntity(driver);
            try {
                if (driver.id) {
                    const response = await fleetApi.updateDriver(driver.id, resource);
                    drivers.value = replaceById(drivers.value, DriverAssembler.toEntityFromResource(response.data));
                } else {
                    const response = await fleetApi.createDriver(resource);
                    drivers.value = drivers.value.concat([DriverAssembler.toEntityFromResource(response.data)]);
                }
                return null;
            } catch (error) {
                if (error.response && error.response.status === 409) return 'documentNumber-taken';
                return 'request-failed';
            }
        });
    }

    return {
        organizationId,
        userId,
        vehicles,
        drivers,
        showOnlyAvailableVehicles,
        showOnlyAvailableDrivers,
        visibleVehicles,
        visibleDrivers,
        vehiclesLoaded,
        driversLoaded,
        isSaving,
        fetchVehicles,
        saveVehicle,
        fetchDrivers,
        saveDriver
    };
});

export default useFleetStore;
