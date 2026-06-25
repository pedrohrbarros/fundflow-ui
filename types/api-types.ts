export interface paths {
    "/api/v1/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Categories"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1CategoriesSearch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteApiV1CategoriesById"];
        options?: never;
        head?: never;
        patch: operations["patchApiV1CategoriesById"];
        trace?: never;
    };
    "/api/v1/sources_of_income": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Sources_of_income"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sources_of_income/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Sources_of_incomeSearch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sources_of_income/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteApiV1Sources_of_incomeById"];
        options?: never;
        head?: never;
        patch: operations["patchApiV1Sources_of_incomeById"];
        trace?: never;
    };
    "/api/v1/payment_methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Payment_methods"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payment_methods/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Payment_methodsSearch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payment_methods/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteApiV1Payment_methodsById"];
        options?: never;
        head?: never;
        patch: operations["patchApiV1Payment_methodsById"];
        trace?: never;
    };
    "/api/v1/expenses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1Expenses"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/expenses/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1ExpensesSearch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/expenses/by-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["postApiV1ExpensesBy-category"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/expenses/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteApiV1ExpensesById"];
        options?: never;
        head?: never;
        patch: operations["patchApiV1ExpensesById"];
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
    postApiV1Categories: {
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
                    type: "INCOME" | "EXPENSE";
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        /** @enum {string} */
                        type?: "INCOME" | "EXPENSE";
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1CategoriesSearch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /**
                     * @description Page number
                     * @default 1
                     */
                    page?: number;
                    /**
                     * @description Items per page
                     * @default 20
                     */
                    limit?: number;
                    /** @description Optional sort. `field` must be a sortable field for the resource; `direction` defaults to asc. */
                    sort?: {
                        field: string;
                        /**
                         * @default asc
                         * @enum {string}
                         */
                        direction?: "asc" | "desc";
                    };
                    /** @description Optional filter — either a single condition or a group of conditions */
                    filters?: {
                        /**
                         * @description name → is_equal, is_not_equal, is_contains, is_starts_with, is_ends_with | type → is_equal, is_not_equal (value: INCOME | EXPENSE) | created_at/updated_at → is_equal, is_before, is_after, is_between
                         * @enum {string}
                         */
                        field: "name" | "type" | "created_at" | "updated_at";
                        /** @enum {string} */
                        op: "is_equal" | "is_not_equal" | "is_contains" | "is_starts_with" | "is_ends_with" | "is_before" | "is_after" | "is_between";
                        /** @description string for name; ISO 8601 string for datetime; [ISO, ISO] tuple for is_between; omit for is_null/is_not_null */
                        value?: unknown;
                    } | {
                        /** @enum {string} */
                        logic: "AND" | "OR";
                        /** @description Array of FilterCondition or nested FilterGroup objects */
                        conditions: Record<string, never>[];
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        categories?: {
                            id?: number;
                            name?: string;
                            /** @enum {string} */
                            type?: "INCOME" | "EXPENSE";
                            /** Format: date-time */
                            created_at?: string;
                            /** Format: date-time */
                            updated_at?: string;
                        }[];
                        pagination?: {
                            page?: number;
                            limit?: number;
                            total?: number;
                        };
                    };
                };
            };
        };
    };
    deleteApiV1CategoriesById: {
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        message?: string;
                    };
                };
            };
        };
    };
    patchApiV1CategoriesById: {
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        /** @enum {string} */
                        type?: "INCOME" | "EXPENSE";
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1Sources_of_income: {
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
                    category_id?: (string | number) | null;
                    income?: number;
                    currency?: string;
                    /** Format: date */
                    date: string;
                    is_recurring?: boolean;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        category_id?: number | null;
                        income?: number;
                        currency?: string;
                        /** Format: date */
                        date?: string;
                        is_recurring?: boolean;
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1Sources_of_incomeSearch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /**
                     * @description Page number
                     * @default 1
                     */
                    page?: number;
                    /**
                     * @description Items per page
                     * @default 20
                     */
                    limit?: number;
                    /** @description Optional sort. `field` must be a sortable field for the resource; `direction` defaults to asc. */
                    sort?: {
                        field: string;
                        /**
                         * @default asc
                         * @enum {string}
                         */
                        direction?: "asc" | "desc";
                    };
                    /**
                     * @description Period granularity. Defaults to "monthly" when omitted.
                     * @enum {string}
                     */
                    granularity?: "daily" | "monthly" | "annually";
                    /**
                     * Format: date
                     * @description Anchor date (YYYY-MM-DD) for the period. Defaults to today when omitted.
                     */
                    date?: string;
                    /** @description Optional filter — either a single condition or a group of conditions */
                    filters?: {
                        /**
                         * @description name/currency → is_equal, is_not_equal, is_contains, is_starts_with, is_ends_with | income → is_equal, is_not_equal, is_greater, is_greater_or_equal, is_lower, is_lower_or_equal, is_between | created_at/updated_at → is_equal, is_before, is_after, is_between
                         * @enum {string}
                         */
                        field: "name" | "income" | "currency" | "created_at" | "updated_at";
                        /** @enum {string} */
                        op: "is_equal" | "is_not_equal" | "is_contains" | "is_starts_with" | "is_ends_with" | "is_greater" | "is_greater_or_equal" | "is_lower" | "is_lower_or_equal" | "is_between" | "is_before" | "is_after";
                        /** @description string for name/currency; number for income; ISO 8601 string for datetime; [a, b] tuple for is_between */
                        value?: unknown;
                    } | {
                        /** @enum {string} */
                        logic: "AND" | "OR";
                        /** @description Array of FilterCondition or nested FilterGroup objects */
                        conditions: Record<string, never>[];
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description Sources of income grouped by category; category_id null = uncategorized */
                        sources_of_income?: {
                            category_id?: number | null;
                            category_name?: string | null;
                            sources?: {
                                id?: number;
                                name?: string;
                                category_id?: number | null;
                                income?: number;
                                currency?: string;
                                /** Format: date */
                                date?: string;
                                is_recurring?: boolean;
                                /** Format: date-time */
                                created_at?: string;
                                /** Format: date-time */
                                updated_at?: string;
                                /** @description Amount applicable in the requested period */
                                period_amount?: number;
                            }[];
                        }[];
                        /** @description Sum of period_amount per currency code (e.g. { "USD": 5000, "EUR": 1000 }) */
                        total?: {
                            [key: string]: number;
                        };
                        pagination?: {
                            page?: number;
                            limit?: number;
                            total?: number;
                        };
                    };
                };
            };
        };
    };
    deleteApiV1Sources_of_incomeById: {
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        message?: string;
                    };
                };
            };
        };
    };
    patchApiV1Sources_of_incomeById: {
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
                    category_id?: (string | number) | null;
                    income?: number;
                    currency?: string;
                    /** Format: date */
                    date?: string;
                    is_recurring?: boolean;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        category_id?: number | null;
                        income?: number;
                        currency?: string;
                        /** Format: date */
                        date?: string;
                        is_recurring?: boolean;
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1Payment_methods: {
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
                    origin: string;
                    receiver?: string;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        origin?: string;
                        receiver?: string | null;
                        user_id?: number;
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1Payment_methodsSearch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /**
                     * @description Page number
                     * @default 1
                     */
                    page?: number;
                    /**
                     * @description Items per page
                     * @default 20
                     */
                    limit?: number;
                    /** @description Optional sort. `field` must be a sortable field for the resource; `direction` defaults to asc. */
                    sort?: {
                        field: string;
                        /**
                         * @default asc
                         * @enum {string}
                         */
                        direction?: "asc" | "desc";
                    };
                    /** @description Optional filter — either a single condition or a group of conditions */
                    filters?: {
                        /**
                         * @description name/origin → is_equal, is_not_equal, is_contains, is_starts_with, is_ends_with | receiver → same + is_null, is_not_null | created_at/updated_at → is_equal, is_before, is_after, is_between
                         * @enum {string}
                         */
                        field: "name" | "origin" | "receiver" | "created_at" | "updated_at";
                        /** @enum {string} */
                        op: "is_equal" | "is_not_equal" | "is_contains" | "is_starts_with" | "is_ends_with" | "is_null" | "is_not_null" | "is_before" | "is_after" | "is_between";
                        /** @description string for name/origin/receiver; ISO 8601 string for datetime; [ISO, ISO] tuple for is_between; omit for is_null/is_not_null */
                        value?: unknown;
                    } | {
                        /** @enum {string} */
                        logic: "AND" | "OR";
                        /** @description Array of FilterCondition or nested FilterGroup objects */
                        conditions: Record<string, never>[];
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        payment_methods?: {
                            id?: number;
                            name?: string;
                            origin?: string;
                            receiver?: string | null;
                            user_id?: number;
                            /** Format: date-time */
                            created_at?: string;
                            /** Format: date-time */
                            updated_at?: string;
                        }[];
                        pagination?: {
                            page?: number;
                            limit?: number;
                            total?: number;
                        };
                    };
                };
            };
        };
    };
    deleteApiV1Payment_methodsById: {
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        message?: string;
                    };
                };
            };
        };
    };
    patchApiV1Payment_methodsById: {
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
                    origin?: string;
                    receiver?: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        origin?: string;
                        receiver?: string | null;
                        user_id?: number;
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1Expenses: {
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
                    category_id?: (string | number) | null;
                    amount: number;
                    /** Format: date */
                    date: string;
                    is_recurring?: boolean;
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
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        category_id?: number | null;
                        amount?: number;
                        /** Format: date */
                        date?: string;
                        is_recurring?: boolean;
                        is_paid?: boolean;
                        is_saved?: boolean;
                        saving_location?: string | null;
                        payment_methods?: {
                            payment_method_id?: number;
                            partial_amount?: number;
                            name?: string;
                            origin?: string;
                            receiver?: string | null;
                        }[];
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
    postApiV1ExpensesSearch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /**
                     * @description Page number
                     * @default 1
                     */
                    page?: number;
                    /**
                     * @description Items per page
                     * @default 20
                     */
                    limit?: number;
                    /** @description Optional sort. `field` must be a sortable field for the resource; `direction` defaults to asc. */
                    sort?: {
                        field: string;
                        /**
                         * @default asc
                         * @enum {string}
                         */
                        direction?: "asc" | "desc";
                    };
                    /**
                     * @description Period granularity. Defaults to "monthly" when omitted.
                     * @enum {string}
                     */
                    granularity?: "daily" | "monthly" | "annually";
                    /**
                     * Format: date
                     * @description Anchor date (YYYY-MM-DD) for the period. Defaults to today when omitted.
                     */
                    date?: string;
                    /** @description Optional filter — either a single condition or a group of conditions */
                    filters?: {
                        /**
                         * @description name → is_equal, is_not_equal, is_contains, is_starts_with, is_ends_with | amount → is_equal, is_not_equal, is_greater, is_greater_or_equal, is_lower, is_lower_or_equal, is_between | is_paid/is_saved → is_equal | saving_location → string ops + is_null, is_not_null | created_at/updated_at → is_equal, is_before, is_after, is_between
                         * @enum {string}
                         */
                        field: "name" | "amount" | "is_paid" | "is_saved" | "saving_location" | "created_at" | "updated_at";
                        /** @enum {string} */
                        op: "is_equal" | "is_not_equal" | "is_contains" | "is_starts_with" | "is_ends_with" | "is_null" | "is_not_null" | "is_greater" | "is_greater_or_equal" | "is_lower" | "is_lower_or_equal" | "is_between" | "is_before" | "is_after";
                        /** @description string for name/saving_location; number for amount; boolean for is_paid/is_saved; ISO 8601 string for datetime; [a, b] tuple for is_between; omit for is_null/is_not_null */
                        value?: unknown;
                    } | {
                        /** @enum {string} */
                        logic: "AND" | "OR";
                        /** @description Array of FilterCondition or nested FilterGroup objects */
                        conditions: Record<string, never>[];
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        expenses?: {
                            id?: number;
                            name?: string;
                            category_id?: number | null;
                            amount?: number;
                            /** Format: date */
                            date?: string;
                            is_recurring?: boolean;
                            is_paid?: boolean;
                            is_saved?: boolean;
                            saving_location?: string | null;
                            payment_methods?: {
                                payment_method_id?: number;
                                partial_amount?: number;
                                name?: string;
                                origin?: string;
                                receiver?: string | null;
                            }[];
                            /** Format: date-time */
                            created_at?: string;
                            /** Format: date-time */
                            updated_at?: string;
                            /** @description Amount applicable in the requested period */
                            period_amount?: number;
                        }[];
                        /** @description Sum of period_amount across all applicable expenses */
                        total?: number;
                        pagination?: {
                            page?: number;
                            limit?: number;
                            total?: number;
                        };
                    };
                };
            };
        };
    };
    "postApiV1ExpensesBy-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /**
                     * @description Page number
                     * @default 1
                     */
                    page?: number;
                    /**
                     * @description Items per page
                     * @default 20
                     */
                    limit?: number;
                    /** @description Optional sort. `field` must be a sortable field for the resource; `direction` defaults to asc. */
                    sort?: {
                        field: string;
                        /**
                         * @default asc
                         * @enum {string}
                         */
                        direction?: "asc" | "desc";
                    };
                    /**
                     * @description Period granularity. Defaults to "monthly" when omitted.
                     * @enum {string}
                     */
                    granularity?: "daily" | "monthly" | "annually";
                    /**
                     * Format: date
                     * @description Anchor date (YYYY-MM-DD) for the period. Defaults to today when omitted.
                     */
                    date?: string;
                    /** @description Optional filter — either a single condition or a group of conditions */
                    filters?: {
                        /**
                         * @description name → is_equal, is_not_equal, is_contains, is_starts_with, is_ends_with | amount → is_equal, is_not_equal, is_greater, is_greater_or_equal, is_lower, is_lower_or_equal, is_between | is_paid/is_saved → is_equal | saving_location → string ops + is_null, is_not_null | created_at/updated_at → is_equal, is_before, is_after, is_between
                         * @enum {string}
                         */
                        field: "name" | "amount" | "is_paid" | "is_saved" | "saving_location" | "created_at" | "updated_at";
                        /** @enum {string} */
                        op: "is_equal" | "is_not_equal" | "is_contains" | "is_starts_with" | "is_ends_with" | "is_null" | "is_not_null" | "is_greater" | "is_greater_or_equal" | "is_lower" | "is_lower_or_equal" | "is_between" | "is_before" | "is_after";
                        /** @description string for name/saving_location; number for amount; boolean for is_paid/is_saved; ISO 8601 string for datetime; [a, b] tuple for is_between; omit for is_null/is_not_null */
                        value?: unknown;
                    } | {
                        /** @enum {string} */
                        logic: "AND" | "OR";
                        /** @description Array of FilterCondition or nested FilterGroup objects */
                        conditions: Record<string, never>[];
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        by_category?: {
                            category_id?: number | null;
                            name?: string;
                            total?: number;
                            count?: number;
                        }[];
                        total?: number;
                    };
                };
            };
        };
    };
    deleteApiV1ExpensesById: {
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        message?: string;
                    };
                };
            };
        };
    };
    patchApiV1ExpensesById: {
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
                    category_id?: (string | number) | null;
                    amount?: number;
                    /** Format: date */
                    date?: string;
                    is_recurring?: boolean;
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
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        id?: number;
                        name?: string;
                        category_id?: number | null;
                        amount?: number;
                        /** Format: date */
                        date?: string;
                        is_recurring?: boolean;
                        is_paid?: boolean;
                        is_saved?: boolean;
                        saving_location?: string | null;
                        payment_methods?: {
                            payment_method_id?: number;
                            partial_amount?: number;
                            name?: string;
                            origin?: string;
                            receiver?: string | null;
                        }[];
                        /** Format: date-time */
                        created_at?: string;
                        /** Format: date-time */
                        updated_at?: string;
                    };
                };
            };
        };
    };
}
