import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import * as c from './super-admin.controller.js';

export const schoolAdminRoutes = Router();

schoolAdminRoutes.use(authenticate);
schoolAdminRoutes.use(authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'));

// ── Dashboard ──────────────────────────────────────────────
// GET /school-admin/stats — school-scoped counts for dashboard
schoolAdminRoutes.get('/stats', c.getSchoolStats);

// ── Audit logs ─────────────────────────────────────────────
// GET /school-admin/audit-logs — actions performed within this school
schoolAdminRoutes.get('/audit-logs', c.getSchoolAuditLogs);

// ── User management ────────────────────────────────────────
// GET  /school-admin/users?search=&role=&departmentId=&page=&limit=
schoolAdminRoutes.get('/users', c.listSchoolUsers);
// PATCH /school-admin/users/:userId/block
schoolAdminRoutes.patch('/users/:userId/block', c.blockSchoolUser);
// PATCH /school-admin/users/:userId/unblock
schoolAdminRoutes.patch('/users/:userId/unblock', c.unblockSchoolUser);

// ── Agent management ───────────────────────────────────────
// GET   /school-admin/agents?status=PENDING|APPROVED|REJECTED
schoolAdminRoutes.get('/agents', c.listAllAgents);
// PATCH /school-admin/agents/:userId/revoke — demote approved agent back to STUDENT
schoolAdminRoutes.patch('/agents/:userId/revoke', c.revokeAgent);

// ── School structure (read-only) ───────────────────────────
// GET /school-admin/faculties
schoolAdminRoutes.get('/faculties', c.getSchoolFaculties);
// GET /school-admin/departments?facultyId=
schoolAdminRoutes.get('/departments', c.getSchoolDepartments);

// ── Freshers FAQ management ────────────────────────────────
// GET    /school-admin/faqs
schoolAdminRoutes.get('/faqs', c.listSchoolFaqs);
// POST   /school-admin/faqs
schoolAdminRoutes.post('/faqs', c.createSchoolFaq);
// PATCH  /school-admin/faqs/:faqId
schoolAdminRoutes.patch('/faqs/:faqId', c.updateSchoolFaq);
// DELETE /school-admin/faqs/:faqId
schoolAdminRoutes.delete('/faqs/:faqId', c.deleteSchoolFaq);
