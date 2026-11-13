export const SUBSCRIPTION_PLANS = ['free', 'premium'];

export class SignUpCommand {
    constructor({ plan, businessName, taxId, companyEmail, phone, address, firstName, lastName, email, password }) {
        this.plan = plan;
        this.businessName = businessName.trim();
        this.taxId = taxId.trim();
        this.companyEmail = companyEmail.trim().toLowerCase();
        this.phone = phone.trim();
        this.address = address.trim();
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.email = email.trim().toLowerCase();
        this.password = password;
    }
}

export class RegisterUserCommand {
    constructor({ organizationId, firstName, lastName, email, role, password }) {
        this.organizationId = organizationId;
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.email = email.trim().toLowerCase();
        this.role = role;
        this.password = password;
    }
}

export class UpdateUserCommand {
    constructor({ userId, firstName, lastName, email }) {
        this.userId = userId;
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.email = email.trim().toLowerCase();
    }
}

export class AssignRoleCommand {
    constructor({ userId, role }) {
        this.userId = userId;
        this.role = role;
    }
}

export class UpdateOrganizationCommand {
    constructor({ organizationId, businessName, phone, address }) {
        this.organizationId = organizationId;
        this.businessName = businessName.trim();
        this.phone = phone.trim();
        this.address = address.trim();
    }
}
