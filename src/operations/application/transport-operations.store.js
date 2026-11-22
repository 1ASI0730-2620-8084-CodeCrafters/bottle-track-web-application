import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { currentOrganizationId, currentUserId } from '../../iam/application/iam.facade.js';
import { TransportOperationsApi } from '../infrastructure/transport-operations-api.js';
import { TransportOperationAssembler } from '../infrastructure/transport-operation.assembler.js';

const AVAILABLE = 'available';
const CONFLICT = 'conflict';
const HTTP_CONFLICT = 409;
const transportOperationsApi = new TransportOperationsApi();

async function sendOrConflict(request) {
    try {
        return await request();
    } catch (error) {
        if (error.response && error.response.status === HTTP_CONFLICT) return CONFLICT;
        throw error;
    }
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

    function assignVehicle(operation, vehicleId) {
        return runOnOperation(operation, async () => {
            if (!operation.isPending) return 'operation-not-pending';
            const response = await sendOrConflict(() => transportOperationsApi.assignVehicle(operation.id, vehicleId));
            if (response === CONFLICT) return 'resource-not-available';
            await fetchReferences(operation.organizationId);
            return null;
        });
    }

    function assignDriver(operation, driverId) {
        return runOnOperation(operation, async () => {
            if (!operation.isPending) return 'operation-not-pending';
            const response = await sendOrConflict(() => transportOperationsApi.assignDriver(operation.id, driverId));
            if (response === CONFLICT) return 'resource-not-available';
            await fetchReferences(operation.organizationId);
            return null;
        });
    }

    function startOperation(operation) {
        return runOnOperation(operation, async () => {
            if (!operation.canStart) return 'operation-cannot-start';
            await transportOperationsApi.startOperation(operation.id);
            return null;
        });
    }

    function recordDelivery(operation, command) {
        return runOnOperation(operation, async () => {
            if (!operation.isInProgress || !command.stop.isPending) return 'delivery-not-recordable';
            await transportOperationsApi.recordDelivery(operation.id, command.stop.id, {
                status: command.status,
                deliveredQuantity: command.deliveredQuantity,
                failureReason: command.failureReason
            });
            return null;
        });
    }

    function completeOperation(operation) {
        return runOnOperation(operation, async () => {
            if (!operation.canComplete) return 'operation-has-pending-deliveries';
            await transportOperationsApi.completeOperation(operation.id);
            await fetchReferences(operation.organizationId);
            return null;
        });
    }

    function cancelOperation(operation, reason) {
        return runOnOperation(operation, async () => {
            if (!operation.canCancel) return 'operation-already-started';
            if (!reason || !reason.trim()) return 'cancellation-reason-required';
            await transportOperationsApi.cancelOperation(operation.id, reason.trim());
            await fetchReferences(operation.organizationId);
            return null;
        });
    }

    function moveStop(operation, stop, offset) {
        return runOnOperation(operation, async () => {
            if (!operation.isPending) return 'operation-not-pending';
            await transportOperationsApi.moveStop(operation.id, stop.id, offset);
            return null;
        });
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
