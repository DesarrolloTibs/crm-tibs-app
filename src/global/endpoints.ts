const urlBase = import.meta.env.VITE_BASE_URL;

export const auth = {
    LOGIN: urlBase + 'auth/login'
};

export const CLIENTS = {
    CLIENTS: urlBase + 'clients'
};

export const Opportunities = {
    OPPORTUNITIES: urlBase + 'opportunities'
};
/*export const ENDPOINTS = {
    LOGIN: '/auth/login',
    CLIENTS: 'http://localhost:3090/clients',
    // otros endpoints...
};*/