export interface paths {
    "/v1/webhooks/clerk/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postV1WebhooksClerkRegister"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getV1Categories"];
        put?: never;
        post: operations["postV1Categories"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteV1CategoriesById"];
        options?: never;
        head?: never;
        patch: operations["patchV1CategoriesById"];
        trace?: never;
    };
    "/v1/sources_of_income": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getV1Sources_of_income"];
        put?: never;
        post: operations["postV1Sources_of_income"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/sources_of_income/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteV1Sources_of_incomeById"];
        options?: never;
        head?: never;
        patch: operations["patchV1Sources_of_incomeById"];
        trace?: never;
    };
    "/v1/payment_methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getV1Payment_methods"];
        put?: never;
        post: operations["postV1Payment_methods"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/payment_methods/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteV1Payment_methodsById"];
        options?: never;
        head?: never;
        patch: operations["patchV1Payment_methodsById"];
        trace?: never;
    };
    "/v1/expenses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getV1Expenses"];
        put?: never;
        post: operations["postV1Expenses"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/expenses/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteV1ExpensesById"];
        options?: never;
        head?: never;
        patch: operations["patchV1ExpensesById"];
        trace?: never;
    };
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getIndex"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/docs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDocs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    postV1WebhooksClerkRegister: {
        parameters: {
            query?: never;
            header: {
                /** @description Unique message identifier for the webhook payload */
                "svix-id": string;
                /** @description Unix timestamp (seconds) when the webhook was sent */
                "svix-timestamp": string;
                /** @description Space-delimited list of signatures (e.g. v1,<base64>) */
                "svix-signature": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    data: {
                        backup_code_enabled: boolean;
                        banned: boolean;
                        create_organization_enabled: boolean;
                        create_organizations_limit: number | null;
                        created_at: number;
                        delete_self_enabled: boolean;
                        email_addresses: unknown[];
                        enterprise_accounts: unknown[];
                        external_accounts: unknown[];
                        external_id: string | null;
                        first_name: string | null;
                        has_image: boolean;
                        id: string;
                        image_url: string;
                        last_active_at: number | null;
                        last_name: string | null;
                        last_sign_in_at: number | null;
                        legal_accepted_at: number | null;
                        locked: boolean;
                        lockout_expires_in_seconds: number | null;
                        mfa_disabled_at: number | null;
                        mfa_enabled_at: number | null;
                        /** @constant */
                        object: "user";
                        passkeys: unknown[];
                        password_enabled: boolean;
                        phone_numbers: unknown[];
                        primary_email_address_id: string | null;
                        primary_phone_number_id: string | null;
                        primary_web3_wallet_id: string | null;
                        private_metadata: {
                            [key: string]: unknown;
                        } | null;
                        profile_image_url: string;
                        public_metadata: {
                            [key: string]: unknown;
                        };
                        saml_accounts: unknown[];
                        totp_enabled: boolean;
                        two_factor_enabled: boolean;
                        unsafe_metadata: {
                            [key: string]: unknown;
                        };
                        updated_at: number;
                        username: string | null;
                        verification_attempts_remaining: number | null;
                        web3_wallets: unknown[];
                    };
                    event_attributes: {
                        http_request: {
                            client_ip: string;
                            user_agent: string;
                        };
                    };
                    instance_id: string;
                    /** @constant */
                    object: "event";
                    timestamp: number;
                    /** @constant */
                    type: "user.created";
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getV1Categories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    postV1Categories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteV1CategoriesById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchV1CategoriesById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getV1Sources_of_income: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    postV1Sources_of_income: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    category_id: string | number;
                    income?: number;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteV1Sources_of_incomeById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchV1Sources_of_incomeById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    category_id?: string | number;
                    income?: number;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getV1Payment_methods: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    postV1Payment_methods: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    bank?: string;
                    receiver?: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteV1Payment_methodsById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchV1Payment_methodsById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    bank?: string | null;
                    receiver?: string | null;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getV1Expenses: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    postV1Expenses: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    amount: number;
                    is_paid?: boolean;
                    is_saved?: boolean;
                    saving_location?: string | null;
                    payment_methods?: {
                        payment_method_id: string | number;
                        partial_amount: number;
                    }[];
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteV1ExpensesById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    patchV1ExpensesById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    amount?: number;
                    is_paid?: boolean;
                    is_saved?: boolean;
                    saving_location?: string | null;
                    payment_methods?: {
                        payment_method_id: string | number;
                        partial_amount: number;
                    }[];
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getIndex: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getDocs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
