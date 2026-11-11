import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const driversEndpointPath = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH;

export class FleetApi extends BaseApi {
    #vehiclesEndpoint;
    #driversEndpoint;

    constructor() {
        super();
        this.#vehiclesEndpoint = new BaseEndpoint(this, vehiclesEndpointPath);
        this.#driversEndpoint = new BaseEndpoint(this, driversEndpointPath);
    }

    getVehicles(organizationId) {
        return this.#vehiclesEndpoint.getAll({ organizationId });
    }

    createVehicle(vehicleResource) {
        return this.#vehiclesEndpoint.create(vehicleResource);
    }

    updateVehicle(vehicleId, vehicleResource) {
        return this.#vehiclesEndpoint.update(vehicleId, vehicleResource);
    }

    getDrivers(organizationId) {
        return this.#driversEndpoint.getAll({ organizationId });
    }

    createDriver(driverResource) {
        return this.#driversEndpoint.create(driverResource);
    }

    updateDriver(driverId, driverResource) {
        return this.#driversEndpoint.update(driverId, driverResource);
    }
}
