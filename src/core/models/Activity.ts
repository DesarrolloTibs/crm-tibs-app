

import type { Client } from "./Client";
import type { Opportunity } from "./Opportunity";
import type { User } from "./User";


export interface Activity {
    id: string;
    activity: string;
    activityType: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    opportunityId: string | null;
    clientId: string | null;
    flaghistory: boolean | null;
    user?: User;
    opportunity?: Opportunity;
    client?: Client;
}
