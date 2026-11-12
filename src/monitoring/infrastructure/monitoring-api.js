import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const iotDevicesEndpointPath = import.meta.env.VITE_IOT_DEVICES_ENDPOINT_PATH;

export class MonitoringApi extends BaseApi {
    #vehiclesEndpoint;
    #devicesEndpoint;

    constructor() {
        super();
        this.#vehiclesEndpoint = new BaseEndpoint(this, vehiclesEndpointPath);
        this.#devicesEndpoint = new BaseEndpoint(this, iotDevicesEndpointPath);
    }

    getVehicles(organizationId) {
        return this.#vehiclesEndpoint.getAll({ organizationId });
    }

    getAllDevices() {
        return this.#devicesEndpoint.getAll();
    }
}
