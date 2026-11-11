export const COMING_SOON = 'coming-soon';

export function isComingSoon(result) {
    return result === COMING_SOON;
}

export function notifyComingSoon(toast, t) {
    toast.add({
        severity: 'info',
        summary: t('shared.coming-soon.title'),
        detail: t('shared.coming-soon.detail'),
        life: 4000
    });
}
