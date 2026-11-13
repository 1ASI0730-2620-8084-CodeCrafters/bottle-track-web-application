import useIamStore from './iam.store.js';

export function currentOrganizationId() {
    const iamStore = useIamStore();
    return iamStore.currentUser ? iamStore.currentUser.organizationId : null;
}

export function currentUserId() {
    const iamStore = useIamStore();
    return iamStore.currentUser ? iamStore.currentUser.id : null;
}
