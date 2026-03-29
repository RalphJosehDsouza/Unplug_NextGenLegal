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
import { CaseType } from './CaseType.js';
import { CaseTypeRequiredDocument } from './CaseTypeRequiredDocument.js';
import { CourtHearing } from './CourtHearing.js';
import { CourtHearingDocument } from './CourtHearingDocument.js';

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

Document.hasMany(ActivityLog, { foreignKey: 'resource_id', as: 'activityLogs', constraints: false });
ActivityLog.belongsTo(Document, { foreignKey: 'resource_id', as: 'document', constraints: false });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

CaseType.hasMany(CaseTypeRequiredDocument, {
  foreignKey: 'case_type_id',
  as: 'required_documents',
});
CaseTypeRequiredDocument.belongsTo(CaseType, {
  foreignKey: 'case_type_id',
  as: 'caseType',
});

User.hasMany(CourtHearing, { foreignKey: 'lawyer_id', as: 'courtHearings' });
CourtHearing.belongsTo(User, { foreignKey: 'lawyer_id', as: 'lawyer' });

CaseType.hasMany(CourtHearing, { foreignKey: 'case_type_id', as: 'hearings' });
CourtHearing.belongsTo(CaseType, { foreignKey: 'case_type_id', as: 'caseType' });

CourtHearing.hasMany(CourtHearingDocument, { foreignKey: 'court_hearing_id', as: 'uploads' });
CourtHearingDocument.belongsTo(CourtHearing, { foreignKey: 'court_hearing_id', as: 'hearing' });

CaseTypeRequiredDocument.hasMany(CourtHearingDocument, {
  foreignKey: 'required_document_id',
  as: 'uploads',
});
CourtHearingDocument.belongsTo(CaseTypeRequiredDocument, {
  foreignKey: 'required_document_id',
  as: 'requiredDocument',
});

Document.hasMany(CourtHearingDocument, { foreignKey: 'document_id', as: 'courtHearingLinks' });
CourtHearingDocument.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });

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
  CaseType,
  CaseTypeRequiredDocument,
  CourtHearing,
  CourtHearingDocument,
};

