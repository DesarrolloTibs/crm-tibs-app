const urlBase = import.meta.env.VITE_BASE_URL;

export const auth = {
    LOGIN: urlBase + 'auth/login'
};

export const CLIENTS = {
    CLIENTS: urlBase + 'clients'
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
/*export const ENDPOINTS = {
    LOGIN: '/auth/login',
    CLIENTS: 'http://localhost:3090/clients',
    // otros endpoints...
};*/