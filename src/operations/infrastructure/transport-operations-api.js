import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const transportOperationsEndpointPath = import.meta.env.VITE_TRANSPORT_OPERATIONS_ENDPOINT_PATH;
const deliveryPointsEndpointPath = import.meta.env.VITE_DELIVERY_POINTS_ENDPOINT_PATH;
const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const driversEndpointPath = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH;

export class TransportOperationsApi extends BaseApi {
    #operationsEndpoint;
    #deliveryPointsEndpoint;
    #vehiclesEndpoint;
    #driversEndpoint;

    constructor() {
        super();
        this.#operationsEndpoint = new BaseEndpoint(this, transportOperationsEndpointPath);
        this.#deliveryPointsEndpoint = new BaseEndpoint(this, deliveryPointsEndpointPath);
        this.#vehiclesEndpoint = new BaseEndpoint(this, vehiclesEndpointPath);
        this.#driversEndpoint = new BaseEndpoint(this, driversEndpointPath);
    }

    getOperations(organizationId) {
        return this.#operationsEndpoint.getAll({ organizationId });
    }

    getOperationById(operationId) {
        return this.#operationsEndpoint.getById(operationId);
    }

    createOperation(operationResource) {
        return this.#operationsEndpoint.create(operationResource);
    }

    addStop(operationId, stopResource) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/delivery-stops`, stopResource);
    }

    moveStop(operationId, stopId, offset) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/delivery-stops/${stopId}/moves`, { offset });
    }

    assignVehicle(operationId, vehicleId) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/vehicle-assignments`, { vehicleId });
    }

    assignDriver(operationId, driverId) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/driver-assignments`, { driverId });
    }

    startOperation(operationId) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/starts`);
    }

    recordDelivery(operationId, stopId, deliveryResource) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/delivery-stops/${stopId}/deliveries`, deliveryResource);
    }

    completeOperation(operationId) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/completions`);
    }

    cancelOperation(operationId, reason) {
        return this.http.post(`${transportOperationsEndpointPath}/${operationId}/cancellations`, { reason });
    }

    getDeliveryPoints(organizationId) {
        return this.#deliveryPointsEndpoint.getAll({ organizationId });
    }

    getVehicles(organizationId) {
        return this.#vehiclesEndpoint.getAll({ organizationId });
    }

    getDrivers(organizationId) {
        return this.#driversEndpoint.getAll({ organizationId });
    }
}
