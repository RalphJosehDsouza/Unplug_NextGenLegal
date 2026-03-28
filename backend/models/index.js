import { sequelize } from '../config/db.js';

import { User } from './User.js';
import { Lawyer } from './Lawyer.js';
import { Document } from './Document.js';
import { Subscription } from './Subscription.js';
import { Booking } from './Booking.js';
import { ComplianceTask } from './ComplianceTask.js';
import { ActivityLog } from './ActivityLog.js';
import { Review } from './Review.js';
import { Notification } from './Notification.js';

// Associations
User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Subscription, { foreignKey: 'user_id', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Lawyer, { foreignKey: 'user_id', as: 'lawyer' });
Lawyer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Lawyer.hasMany(Booking, { foreignKey: 'lawyer_id', as: 'lawyerBookings' });
Booking.belongsTo(Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });

User.hasMany(ComplianceTask, { foreignKey: 'user_id', as: 'complianceTasks' });
ComplianceTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  User,
  Lawyer,
  Document,
  Subscription,
  Booking,
  ComplianceTask,
  ActivityLog,
  Review,
  Notification,
};

