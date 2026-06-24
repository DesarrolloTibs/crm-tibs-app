const urlBase = import.meta.env.VITE_BASE_URL + '/api/';

export const auth = {
    LOGIN: urlBase + 'auth/login',
    FORGOT_PASSWORD: urlBase + 'auth/forgot-password',
    RESET_PASSWORD: urlBase + 'auth/reset-password',
};

export const CLIENTS = {
    CLIENTS: urlBase + 'clients'
};

export const COMPANIES = {
    COMPANIES: urlBase + 'companies'
};


export const OPPORTUNITIES = {
    OPPORTUNITIES: urlBase + 'opportunities'
};
export const REMINDERS = {
    REMINDERS: urlBase + 'reminders',
};


export const INTERACTIONS = {
    INTERACTIONS: urlBase + 'interactions',
};
export const USERS = {
    USERS: urlBase + 'users',
};

export const ACTIVITIES = {
    ACTIVITIES: urlBase + 'activities',
};

export const EXPENSES = {
    EXPENSES: urlBase + 'expenses',
};

export const PIPELINES = {
    PIPELINES: urlBase + 'pipelines',
};

export const PRODUCTS = {
    PRODUCTS: urlBase + 'products',
};

export const OPPORTUNITY_LABELS = {
    OPPORTUNITY_LABELS: urlBase + 'opportunity-labels',
};

export const OPPORTUNITY_CATALOGS = {
    BUSINESS_LINES: urlBase + 'business-lines',
    DELIVERY_TYPES: urlBase + 'delivery-types',
    LICENSINGS: urlBase + 'licensings',
};

export const HELPDESKS = {
    HELPDESKS: urlBase + 'helpdesks',
};

export const TICKETS = {
    TICKETS: urlBase + 'tickets',
};

/*export const ENDPOINTS = {
    LOGIN: '/auth/login',
    CLIENTS: 'http://localhost:3090/clients',
    // otros endpoints...
};*/