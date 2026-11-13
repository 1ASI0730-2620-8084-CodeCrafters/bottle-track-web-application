<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useIamStore from '../../application/iam.store.js';
import { SignUpCommand, SUBSCRIPTION_PLANS } from '../../domain/model/user-commands.js';
import BrandLogo from '../../../shared/presentation/components/brand-logo.vue';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_ID_PATTERN = /^\d{11}$/;
const MINIMUM_PASSWORD_LENGTH = 8;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useIamStore();

function initialPlan() {
    const requestedPlan = route.query.plan;
    return SUBSCRIPTION_PLANS.includes(requestedPlan) ? requestedPlan : SUBSCRIPTION_PLANS[0];
}

const form = reactive({
    plan: initialPlan(),
    businessName: '',
    taxId: '',
    companyEmail: '',
    phone: '',
    address: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
});
const wasSubmitted = ref(false);
const submitError = ref(null);

const planOptions = computed(() => SUBSCRIPTION_PLANS.map(plan => ({ value: plan, label: t(`iam.sign-up.plans.${plan}`) })));

const errors = computed(() => {
    const found = {};
    if (!form.businessName.trim()) found.businessName = 'iam.sign-up.required';
    if (!TAX_ID_PATTERN.test(form.taxId.trim())) found.taxId = 'iam.sign-up.tax-id-invalid';
    if (!EMAIL_PATTERN.test(form.companyEmail.trim())) found.companyEmail = 'iam.sign-up.email-invalid';
    if (!form.firstName.trim()) found.firstName = 'iam.sign-up.required';
    if (!form.lastName.trim()) found.lastName = 'iam.sign-up.required';
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'iam.sign-up.email-invalid';
    if (form.password.length < MINIMUM_PASSWORD_LENGTH) found.password = 'iam.sign-up.password-short';
    return found;
});

function errorFor(field) {
    return wasSubmitted.value ? errors.value[field] : null;
}

async function performSignUp() {
    wasSubmitted.value = true;
    submitError.value = null;
    if (Object.keys(errors.value).length > 0) return;
    const error = await store.signUp(new SignUpCommand(form));
    if (error) {
        submitError.value = error;
        return;
    }
    router.replace({ name: 'home' });
}
</script>

<template>
    <main class="sign-up">
        <div class="sign-up__card">
            <div class="sign-up__header">
                <brand-logo/>
                <language-switcher/>
            </div>
            <div>
                <h1 class="sign-up__title">{{ t('iam.sign-up.title') }}</h1>
                <p class="sign-up__lead">{{ t('iam.sign-up.lead') }}</p>
            </div>
            <pv-message v-if="submitError" severity="error" role="alert">{{ t(`iam.sign-up.errors.${submitError}`) }}</pv-message>
            <form class="sign-up__form" novalidate @submit.prevent="performSignUp">
                <div class="sign-up__field">
                    <label for="sign-up-plan">{{ t('iam.sign-up.plan') }}</label>
                    <pv-select v-model="form.plan" input-id="sign-up-plan" :options="planOptions" option-label="label" option-value="value" fluid/>
                </div>

                <fieldset class="sign-up__group">
                    <legend>{{ t('iam.sign-up.company') }}</legend>
                    <div class="sign-up__field">
                        <label for="sign-up-business-name">{{ t('iam.sign-up.business-name') }}</label>
                        <pv-input-text id="sign-up-business-name" v-model="form.businessName" :invalid="!!errorFor('businessName')" fluid/>
                        <small v-if="errorFor('businessName')" class="sign-up__error">{{ t(errorFor('businessName')) }}</small>
                    </div>
                    <div class="sign-up__row">
                        <div class="sign-up__field">
                            <label for="sign-up-tax-id">{{ t('iam.sign-up.tax-id') }}</label>
                            <pv-input-text id="sign-up-tax-id" v-model="form.taxId" inputmode="numeric" :invalid="!!errorFor('taxId')" fluid/>
                            <small v-if="errorFor('taxId')" class="sign-up__error">{{ t(errorFor('taxId')) }}</small>
                        </div>
                        <div class="sign-up__field">
                            <label for="sign-up-phone">{{ t('iam.sign-up.phone') }}</label>
                            <pv-input-text id="sign-up-phone" v-model="form.phone" inputmode="tel" fluid/>
                        </div>
                    </div>
                    <div class="sign-up__field">
                        <label for="sign-up-company-email">{{ t('iam.sign-up.company-email') }}</label>
                        <pv-input-text id="sign-up-company-email" v-model="form.companyEmail" type="email" :invalid="!!errorFor('companyEmail')" fluid/>
                        <small v-if="errorFor('companyEmail')" class="sign-up__error">{{ t(errorFor('companyEmail')) }}</small>
                    </div>
                    <div class="sign-up__field">
                        <label for="sign-up-address">{{ t('iam.sign-up.address') }}</label>
                        <pv-input-text id="sign-up-address" v-model="form.address" fluid/>
                    </div>
                </fieldset>

                <fieldset class="sign-up__group">
                    <legend>{{ t('iam.sign-up.administrator') }}</legend>
                    <div class="sign-up__row">
                        <div class="sign-up__field">
                            <label for="sign-up-first-name">{{ t('iam.sign-up.first-name') }}</label>
                            <pv-input-text id="sign-up-first-name" v-model="form.firstName" :invalid="!!errorFor('firstName')" fluid/>
                            <small v-if="errorFor('firstName')" class="sign-up__error">{{ t(errorFor('firstName')) }}</small>
                        </div>
                        <div class="sign-up__field">
                            <label for="sign-up-last-name">{{ t('iam.sign-up.last-name') }}</label>
                            <pv-input-text id="sign-up-last-name" v-model="form.lastName" :invalid="!!errorFor('lastName')" fluid/>
                            <small v-if="errorFor('lastName')" class="sign-up__error">{{ t(errorFor('lastName')) }}</small>
                        </div>
                    </div>
                    <div class="sign-up__field">
                        <label for="sign-up-email">{{ t('iam.sign-up.email') }}</label>
                        <pv-input-text id="sign-up-email" v-model="form.email" type="email" autocomplete="email" :invalid="!!errorFor('email')" fluid/>
                        <small v-if="errorFor('email')" class="sign-up__error">{{ t(errorFor('email')) }}</small>
                    </div>
                    <div class="sign-up__field">
                        <label for="sign-up-password">{{ t('iam.sign-up.password') }}</label>
                        <pv-password v-model="form.password" input-id="sign-up-password" :feedback="false" :invalid="!!errorFor('password')" :input-props="{ autocomplete: 'new-password' }" toggle-mask fluid/>
                        <small v-if="errorFor('password')" class="sign-up__error">{{ t(errorFor('password')) }}</small>
                    </div>
                </fieldset>

                <pv-button type="submit" :label="t('iam.sign-up.submit')" :loading="store.isSigningIn" fluid/>
            </form>
            <p class="sign-up__footer">
                {{ t('iam.sign-up.has-account') }}
                <router-link :to="{ name: 'iam-sign-in' }">{{ t('iam.sign-up.go-to-sign-in') }}</router-link>
            </p>
        </div>
    </main>
</template>

<style scoped>
.sign-up {
    display: flex;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-8) var(--space-6);
    background: var(--surface-muted);
}

.sign-up__card {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    width: 100%;
    max-width: 36rem;
    height: fit-content;
    padding: var(--space-8);
    border-radius: var(--radius-lg, 12px);
    background: var(--surface);
}

.sign-up__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sign-up__title {
    font-size: var(--text-2xl);
}

.sign-up__lead {
    margin: var(--space-1) 0 0;
    color: var(--ink-70);
    font-size: var(--text-sm);
}

.sign-up__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
}

.sign-up__group {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    border: 0;
}

.sign-up__group legend {
    margin-bottom: var(--space-3);
    color: var(--primary-dark);
    font-weight: var(--weight-bold);
}

.sign-up__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
}

.sign-up__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.sign-up__field label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
}

.sign-up__error {
    color: var(--danger-strong);
}

.sign-up__footer {
    margin: 0;
    color: var(--ink-60);
    font-size: var(--text-sm);
    text-align: center;
}

.sign-up__footer a {
    color: var(--primary-mid);
}

@media (max-width: 40rem) {
    .sign-up__row {
        grid-template-columns: 1fr;
    }
}
</style>
