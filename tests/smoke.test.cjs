const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('School Hub smoke coverage', () => {
  test('emergency contact schema includes category enum and whatsappNumber field', () => {
    const schema = read('backend/prisma/schema.prisma');

    expect(schema).toContain('EmergencyCategory');
    expect(schema).toContain('SECURITY');
    expect(schema).toContain('CLINIC');
    expect(schema).toContain('STUDENT_AFFAIRS');
    expect(schema).toContain('whatsappNumber');
  });

  test('emergency contact validators include category and whatsappNumber', () => {
    const validators = read('backend/src/modules/school/school.validators.ts');

    expect(validators).toContain('emergencyCategoryEnum');
    expect(validators).toContain('whatsappNumber');
    expect(validators).toContain('SECURITY');
    expect(validators).toContain('CLINIC');
    expect(validators).toContain('STUDENT_AFFAIRS');
  });

  test('emergency contact service returns whatsappNumber and category', () => {
    const service = read('backend/src/modules/school/school.service.ts');

    expect(service).toContain('whatsappNumber: true');
    expect(service).toContain('category: true');
  });

  test('emergency contact migration adds category and whatsapp_number columns', () => {
    const migration = read('backend/prisma/migrations/20260614000000_emergency_contact_upgrades/migration.sql');

    expect(migration).toContain('EmergencyCategory');
    expect(migration).toContain('whatsapp_number');
    expect(migration).toContain('category');
  });

  test('seed includes emergency contacts with correct categories', () => {
    const seed = read('backend/prisma/seed.ts');

    expect(seed).toContain('SECURITY');
    expect(seed).toContain('CLINIC');
    expect(seed).toContain('STUDENT_AFFAIRS');
    expect(seed).toContain('emergencyContact');
  });

  test('job listings schema includes JobType enum, JobApprovalStatus, and whatsapp field', () => {
    const schema = read('backend/prisma/schema.prisma');

    expect(schema).toContain('JobType');
    expect(schema).toContain('INTERNSHIP');
    expect(schema).toContain('PART_TIME');
    expect(schema).toContain('CAMPUS_JOB');
    expect(schema).toContain('FREELANCE');
    expect(schema).toContain('JobApprovalStatus');
    expect(schema).toContain('JobListing');
    expect(schema).toContain('whatsapp');
  });

  test('job listings migration creates job_listings table with approval status', () => {
    const migration = read('backend/prisma/migrations/20260614100000_job_listings/migration.sql');

    expect(migration).toContain('job_listings');
    expect(migration).toContain('JobApprovalStatus');
    expect(migration).toContain('JobType');
    expect(migration).toContain('approvalStatus');
    expect(migration).toContain('whatsapp');
  });

  test('job listings validators cover all types, list, and reject schemas', () => {
    const validators = read('backend/src/modules/marketplace/marketplace.validators.ts');

    expect(validators).toContain('createJobSchema');
    expect(validators).toContain('listJobsSchema');
    expect(validators).toContain('rejectJobSchema');
    expect(validators).toContain('INTERNSHIP');
    expect(validators).toContain('CAMPUS_JOB');
  });

  test('job listings service has approve, reject, and pending queue methods', () => {
    const service = read('backend/src/modules/marketplace/marketplace.service.ts');

    expect(service).toContain('listPendingJobs');
    expect(service).toContain('approveJob');
    expect(service).toContain('rejectJob');
    expect(service).toContain('approvalStatus');
  });

  test('job listings routes include admin approve/reject and pending queue endpoints', () => {
    const routes = read('backend/src/modules/marketplace/marketplace.routes.ts');

    expect(routes).toContain('/jobs');
    expect(routes).toContain('/jobs/pending');
    expect(routes).toContain('/jobs/:id/approve');
    expect(routes).toContain('/jobs/:id/reject');
    expect(routes).toContain("authorize('SCHOOL_ADMIN', 'SUPER_ADMIN')");
  });

  test('seed data includes real Nigerian universities and the active campus GeoJSON path', () => {
    const seed = read('backend/prisma/seed.ts');

    expect(seed).toContain('University of Lagos');
    expect(seed).toContain('Obafemi Awolowo University');
    expect(seed).toContain('Covenant University');
    expect(seed).toContain('buildings_from_points.geojson');
  });

  test('mailer supports OTPs, announcements, and event reminders', () => {
    const mailer = read('backend/src/config/mailer.ts');

    expect(mailer).toContain('sendOTP');
    expect(mailer).toContain('sendAnnouncement');
    expect(mailer).toContain('sendEventReminder');
  });

  test('Firebase wrapper exposes topic subscription and broadcast helpers', () => {
    const firebase = read('backend/src/config/firebase.ts');

    expect(firebase).toContain('sendTopic');
    expect(firebase).toContain('subscribeToTopics');
  });

  test('map web rebuild includes labels, search, and live location controls', () => {
    const html = read('map-web/index.html');
    const layers = read('map-web/src/map/layers/layerDefinitions.ts');
    const search = read('map-web/src/ui/search/SearchBar.tsx');
    const controls = read('map-web/src/map/controls/FloatingControls.tsx');

    expect(html).toContain('id="root"');
    expect(search).toContain('Search campus');
    expect(layers).toContain('campus-labels');
    expect(controls).toContain('navigator.geolocation');
  });
});
