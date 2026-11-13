import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { currentOrganizationId, currentUserId } from '../../iam/application/iam.facade.js';
import { IncidentsApi } from '../infrastructure/incidents-api.js';
import { IncidentAssembler, EvidenceAssembler } from '../infrastructure/incident.assembler.js';

const incidentsApi = new IncidentsApi();

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

const useIncidentsStore = defineStore('incidents', () => {
    const organizationId = computed(() => currentOrganizationId());
    const userId = computed(() => currentUserId());
    const incidents = ref([]);
    const operations = ref([]);
    const stops = ref([]);
    const incidentsLoaded = ref(false);
    const isSaving = ref(false);
    const evidences = ref([]);
    const evidencesLoaded = ref(false);

    const openIncidents = computed(() => incidents.value.filter(incident => incident.isOpen));
    const reportableOperations = computed(() => operations.value.filter(operation => operation.status !== 'cancelled'));

    async function fetchIncidents(organizationId) {
        const { data: operationResources } = await incidentsApi.getOperations(organizationId);
        operations.value = operationResources;
        stops.value = stopsOf(operationResources);
        if (operationResources.length === 0) {
            incidents.value = [];
        } else {
            const responses = await Promise.all(
                operationResources.map(operation => incidentsApi.getIncidentsByOperation(operation.id)));
            const resources = responses
                .flatMap(response => response.data)
                .sort((first, second) => String(second.reportedAt).localeCompare(String(first.reportedAt)));
            incidents.value = IncidentAssembler.toEntitiesFromResources(resources, operationResources);
        }
        incidentsLoaded.value = true;
    }

    async function runSaving(action) {
        isSaving.value = true;
        try {
            return await action();
        } catch {
            return 'request-failed';
        } finally {
            isSaving.value = false;
        }
    }

    function reportIncident(command) {
        return runSaving(async () => {
            if (!command.isValid) return 'invalid-incident';
            const resource = IncidentAssembler.toResourceFromReportCommand(command, IncidentAssembler.nextCode(incidents.value));
            const { data } = await incidentsApi.createIncident(resource);
            incidents.value = [IncidentAssembler.toEntityFromResource(data, operations.value), ...incidents.value];
            return null;
        });
    }

    async function fetchEvidences(incidentId) {
        evidences.value = [];
        evidencesLoaded.value = false;
        const { data } = await incidentsApi.getIncidentById(incidentId);
        evidences.value = EvidenceAssembler.toEntitiesFromResources(data.evidences || []);
        evidencesLoaded.value = true;
    }

    function attachEvidence(command) {
        return runSaving(async () => {
            if (!command.isValid) return 'invalid-evidence';
            const { data } = await incidentsApi.addEvidence(command.incidentId, {
                fileUrl: command.fileUrl,
                fileType: 'image',
                uploadedBy: command.uploadedBy
            });
            evidences.value = EvidenceAssembler.toEntitiesFromResources(data.evidences || []);
            return null;
        });
    }

    function advanceIncident(command) {
        return runSaving(async () => {
            if (!command.isValid) return 'invalid-transition';
            if (command.nextStatus !== 'resolved') return 'coming-soon';
            const { data } = await incidentsApi.resolveIncident(command.incident.id, command.resolution);
            const updated = IncidentAssembler.toEntityFromResource(data, operations.value);
            incidents.value = incidents.value.map(incident => (incident.id === updated.id ? updated : incident));
            return null;
        });
    }

    return {
        organizationId,
        userId,
        incidents,
        operations,
        stops,
        openIncidents,
        reportableOperations,
        incidentsLoaded,
        evidences,
        evidencesLoaded,
        isSaving,
        fetchIncidents,
        reportIncident,
        advanceIncident,
        fetchEvidences,
        attachEvidence
    };
});

export default useIncidentsStore;
