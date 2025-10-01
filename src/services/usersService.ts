import  axiosInstance from "../core/axios/axiosInstance";
import type { User } from "../core/models/User";
import { USERS } from '../global/endpoints';




export const getActiveUsers = async (): Promise<User[]> => {
    const response = await axiosInstance.get(`${USERS.USERS}/active`);
    return response.data;
};