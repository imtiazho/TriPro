import { IUser } from '../models/User';
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: IUser;
      organizationId?: Types.ObjectId;
      userRole?: string;
    }
  }
}
