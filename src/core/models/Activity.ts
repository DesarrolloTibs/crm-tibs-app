

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
    opportunityId?: string;
    user?: User;
    opportunity?: Opportunity;
}
