

import type { Client } from "./Client";
import type { Opportunity } from "./Opportunity";
import type { User } from "./User";

export interface TypeActivity {
    id: number;
    strname: string;
    blnstatus: boolean;
}

export interface Activity {
    id: string;
    activity: string;
    typeActivityId: number | null;
    typeActivity?: TypeActivity;
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
