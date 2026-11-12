import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const incidentsEndpointPath = import.meta.env.VITE_INCIDENTS_ENDPOINT_PATH;
const transportOperationsEndpointPath = import.meta.env.VITE_TRANSPORT_OPERATIONS_ENDPOINT_PATH;

export class IncidentsApi extends BaseApi {
    #incidentsEndpoint;
    #operationsEndpoint;

    constructor() {
        super();
        this.#incidentsEndpoint = new BaseEndpoint(this, incidentsEndpointPath);
        this.#operationsEndpoint = new BaseEndpoint(this, transportOperationsEndpointPath);
    }

    getOperations(organizationId) {
        return this.#operationsEndpoint.getAll({ organizationId });
    }

    getIncidentsByOperation(transportOperationId) {
        return this.#incidentsEndpoint.getAll({ transportOperationId });
    }

    getIncidentById(incidentId) {
        return this.#incidentsEndpoint.getById(incidentId);
    }

    createIncident(incidentResource) {
        return this.#incidentsEndpoint.create(incidentResource);
    }

    addEvidence(incidentId, evidenceResource) {
        return this.http.post(`${incidentsEndpointPath}/${incidentId}/evidences`, evidenceResource);
    }

    resolveIncident(incidentId, resolution) {
        return this.http.put(`${incidentsEndpointPath}/${incidentId}/resolution`, { resolution });
    }
}
