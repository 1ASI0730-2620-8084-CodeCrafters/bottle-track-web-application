import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { currentOrganizationId, currentUserId } from '../../iam/application/iam.facade.js';
import { TransportOperationsApi } from '../infrastructure/transport-operations-api.js';
import { TransportOperationAssembler } from '../infrastructure/transport-operation.assembler.js';

const AVAILABLE = 'available';
const transportOperationsApi = new TransportOperationsApi();

function comingSoon() {
    return Promise.resolve('coming-soon');
}

function stopsOf(operationResources) {
    const stops = [];
    operationResources.forEach(operation => {
        const deliveryStops = operation.deliveryStops || [];
        deliveryStops.forEach(stop => {
            const operationStop = Object.assign({}, stop);
            operationStop.transportOperationId = operation.id;
            stops.push(operationStop);
        });
    });
    return stops;
}

const useTransportOperationsStore = defineStore('transport-operations', () => {
    const organizationId = computed(() => currentOrganizationId());
    const userId = computed(() => currentUserId());
    const operations = ref([]);
    const operationsLoaded = ref(false);
    const currentOperation = ref(null);
    const vehicles = ref([]);
    const drivers = ref([]);
    const deliveryPoints = ref([]);
    const isSaving = ref(false);

    const availableVehicles = computed(() => vehicles.value.filter(vehicle => vehicle.status === AVAILABLE));
    const availableDrivers = computed(() => drivers.value.filter(driver => driver.status === AVAILABLE));

    async function fetchReferences(organizationId) {
        const [vehiclesResponse, driversResponse, pointsResponse] = await Promise.all([
            transportOperationsApi.getVehicles(organizationId),
            transportOperationsApi.getDrivers(organizationId),
            transportOperationsApi.getDeliveryPoints(organizationId)
        ]);
        vehicles.value = vehiclesResponse.data;
        drivers.value = driversResponse.data;
        deliveryPoints.value = pointsResponse.data;
    }

    function references(stops) {
        return { stops, vehicles: vehicles.value, drivers: drivers.value, deliveryPoints: deliveryPoints.value };
    }


    async function fetchOperations(organizationId) {
        await fetchReferences(organizationId);
        const { data: operationResources } = await transportOperationsApi.getOperations(organizationId);
        operations.value = TransportOperationAssembler.toEntitiesFromResources(operationResources, references(stopsOf(operationResources)));
        operationsLoaded.value = true;
    }

    async function fetchOperation(operationId) {
        const { data: operationResource } = await transportOperationsApi.getOperationById(operationId);
        await fetchReferences(operationResource.organizationId);
        currentOperation.value = TransportOperationAssembler.toEntityFromResource(operationResource, references(stopsOf([operationResource])));
    }

    async function runOnOperation(operation, action) {
        isSaving.value = true;
        try {
            const error = await action();
            await fetchOperation(operation.id);
            return error ?? null;
        } catch {
            return 'request-failed';
        } finally {
            isSaving.value = false;
        }
    }

    async function createOperation(command) {
        isSaving.value = true;
        try {
            const { data: existing } = await transportOperationsApi.getOperations(command.organizationId);
            const resource = TransportOperationAssembler.toResourceFromCreateCommand(command, TransportOperationAssembler.nextCode(existing));
            const { data } = await transportOperationsApi.createOperation(resource);
            return { operationId: data.id, error: null };
        } catch {
            return { operationId: null, error: 'request-failed' };
        } finally {
            isSaving.value = false;
        }
    }

    function addDeliveryStop(command) {
        return runOnOperation(command.operation, async () => {
            if (!command.operation.isPending) return 'operation-not-pending';
            await transportOperationsApi.addStop(command.operation.id, {
                deliveryPointId: command.deliveryPointId,
                sequenceNumber: command.operation.nextSequenceNumber,
                plannedQuantity: command.plannedQuantity
            });
            return null;
        });
    }

    function assignVehicle() {
        return comingSoon();
    }

    function assignDriver() {
        return comingSoon();
    }

    function startOperation() {
        return comingSoon();
    }

    function recordDelivery() {
        return comingSoon();
    }

    function completeOperation() {
        return comingSoon();
    }

    function cancelOperation() {
        return comingSoon();
    }

    function moveStop() {
        return comingSoon();
    }

    return {
        organizationId,
        userId,
        operations,
        operationsLoaded,
        currentOperation,
        deliveryPoints,
        availableVehicles,
        availableDrivers,
        isSaving,
        fetchOperations,
        fetchOperation,
        createOperation,
        assignVehicle,
        assignDriver,
        addDeliveryStop,
        startOperation,
        recordDelivery,
        completeOperation,
        cancelOperation,
        moveStop
    };
});

export default useTransportOperationsStore;
