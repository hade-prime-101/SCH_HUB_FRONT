import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { campusGeojsonImportService } from '../src/modules/campus-map/ingest/geojson-import.service.js';

const prisma = new PrismaClient();

// ── Active schools ─────────────────────────────────────────────────────────
// Only UNILESA is seeded for now. To add more schools later, uncomment the
// relevant block below and re-run: npm run prisma:seed --workspace backend
// ──────────────────────────────────────────────────────────────────────────

const universities = [
  {
    name: 'University of Ilesa',
    shortCode: 'UNILESA',
    location: 'Ilesa, Osun State',
    faculties: [
      {
        name: 'Faculty of Science',
        departments: [
          { name: 'Computer Science', shortCode: 'CSC' },
          { name: 'Mathematics', shortCode: 'MTH' },
          { name: 'Physics', shortCode: 'PHY' },
          { name: 'Chemistry', shortCode: 'CHM' },
          { name: 'Biochemistry', shortCode: 'BCH' },
          { name: 'Microbiology', shortCode: 'MCB' },
          { name: 'Statistics', shortCode: 'STA' },
        ],
      },
      {
        name: 'Faculty of Engineering',
        departments: [
          { name: 'Electrical & Electronics Engineering', shortCode: 'EEE' },
          { name: 'Mechanical Engineering', shortCode: 'MEE' },
          { name: 'Civil Engineering', shortCode: 'CVE' },
          { name: 'Chemical Engineering', shortCode: 'CHE' },
          { name: 'Computer Engineering', shortCode: 'CPE' },
        ],
      },
      {
        name: 'Faculty of Social Sciences',
        departments: [
          { name: 'Economics', shortCode: 'ECO' },
          { name: 'Political Science', shortCode: 'POL' },
          { name: 'Sociology', shortCode: 'SOC' },
          { name: 'Psychology', shortCode: 'PSY' },
          { name: 'Mass Communication', shortCode: 'MAC' },
        ],
      },
      {
        name: 'Faculty of Law',
        departments: [{ name: 'Law', shortCode: 'LAW' }],
      },
      {
        name: 'Faculty of Health Sciences',
        departments: [
          { name: 'Medicine & Surgery', shortCode: 'MED' },
          { name: 'Nursing Science', shortCode: 'NUR' },
          { name: 'Pharmacy', shortCode: 'PHA' },
          { name: 'Medical Laboratory Science', shortCode: 'MLS' },
          { name: 'Public Health', shortCode: 'PBH' },
        ],
      },
      {
        name: 'Faculty of Management Sciences',
        departments: [
          { name: 'Accounting', shortCode: 'ACC' },
          { name: 'Finance', shortCode: 'FIN' },
          { name: 'Business Administration', shortCode: 'BUS' },
          { name: 'Marketing', shortCode: 'MKT' },
          { name: 'Public Administration', shortCode: 'PAD' },
        ],
      },
      {
        name: 'Faculty of Arts & Humanities',
        departments: [
          { name: 'English & Literary Studies', shortCode: 'ENG' },
          { name: 'History & International Studies', shortCode: 'HIS' },
          { name: 'Philosophy', shortCode: 'PHL' },
          { name: 'Linguistics', shortCode: 'LIN' },
          { name: 'Religious Studies', shortCode: 'REL' },
        ],
      },
      {
        name: 'Faculty of Education',
        departments: [
          { name: 'Educational Management', shortCode: 'EDM' },
          { name: 'Curriculum Studies', shortCode: 'CUS' },
          { name: 'Guidance & Counselling', shortCode: 'GNC' },
          { name: 'Science Education', shortCode: 'SCE' },
        ],
      },
    ],
  },

  // ── Uncomment to add more schools when expanding ──────────────────────────

  // {
  //   name: 'University of Lagos',
  //   shortCode: 'UNILAG',
  //   location: 'Lagos',
  //   faculties: [
  //     {
  //       name: 'Faculty of Science',
  //       departments: [
  //         { name: 'Computer Science', shortCode: 'CSC' },
  //         { name: 'Mathematics', shortCode: 'MTH' },
  //         { name: 'Physics', shortCode: 'PHY' },
  //         { name: 'Chemistry', shortCode: 'CHM' },
  //       ],
  //     },
  //     {
  //       name: 'Faculty of Engineering',
  //       departments: [
  //         { name: 'Electrical & Electronics Engineering', shortCode: 'EEE' },
  //         { name: 'Mechanical Engineering', shortCode: 'MEE' },
  //         { name: 'Civil Engineering', shortCode: 'CVE' },
  //       ],
  //     },
  //   ],
  // },

  // {
  //   name: 'Obafemi Awolowo University',
  //   shortCode: 'OAU',
  //   location: 'Ile-Ife, Osun State',
  //   faculties: [
  //     {
  //       name: 'Faculty of Science',
  //       departments: [
  //         { name: 'Computer Science & Engineering', shortCode: 'CSE' },
  //         { name: 'Mathematics', shortCode: 'MTH' },
  //         { name: 'Physics & Engineering Physics', shortCode: 'PHY' },
  //         { name: 'Chemistry', shortCode: 'CHM' },
  //       ],
  //     },
  //     {
  //       name: 'Faculty of Technology',
  //       departments: [
  //         { name: 'Electrical & Electronic Engineering', shortCode: 'EEE' },
  //         { name: 'Mechanical Engineering', shortCode: 'MEE' },
  //         { name: 'Civil Engineering', shortCode: 'CVE' },
  //       ],
  //     },
  //   ],
  // },

  // {
  //   name: 'Covenant University',
  //   shortCode: 'CU',
  //   location: 'Ota, Ogun State',
  //   faculties: [
  //     {
  //       name: 'College of Science and Technology',
  //       departments: [
  //         { name: 'Computer and Information Sciences', shortCode: 'CIS' },
  //         { name: 'Architecture', shortCode: 'ARC' },
  //         { name: 'Building Technology', shortCode: 'BLD' },
  //       ],
  //     },
  //     {
  //       name: 'College of Engineering',
  //       departments: [
  //         { name: 'Electrical and Information Engineering', shortCode: 'EIE' },
  //         { name: 'Mechanical Engineering', shortCode: 'MEE' },
  //         { name: 'Civil Engineering', shortCode: 'CVE' },
  //       ],
  //     },
  //   ],
  // },
];

const mapGeojsonPath = path.resolve(process.cwd(), '..', 'map', 'data', 'raw', 'buildings_from_points.geojson');

function featureCenter(feature: { geometry: { type: string; coordinates: any } }): [number, number] | null {
  if (feature.geometry.type === 'Point') return feature.geometry.coordinates;
  if (feature.geometry.type === 'Polygon') {
    const ring = feature.geometry.coordinates[0] as [number, number][];
    const usable = ring.slice(0, -1);
    const sums = usable.reduce(
      (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
      { lng: 0, lat: 0 },
    );
    return [sums.lng / usable.length, sums.lat / usable.length];
  }
  return null;
}

async function main() {
  console.log('Seeding universities...');

  for (const uni of universities) {
    const school = await prisma.school.upsert({
      where: { shortCode: uni.shortCode },
      update: { name: uni.name, location: uni.location },
      create: { name: uni.name, shortCode: uni.shortCode, location: uni.location },
    });

    for (const fac of uni.faculties) {
      const faculty = await prisma.faculty.upsert({
        where: { name_schoolId: { name: fac.name, schoolId: school.id } },
        update: {},
        create: { name: fac.name, schoolId: school.id },
      });

      for (const dept of fac.departments) {
        await prisma.department.upsert({
          where: { shortCode_facultyId: { shortCode: dept.shortCode, facultyId: faculty.id } },
          update: { name: dept.name },
          create: { name: dept.name, shortCode: dept.shortCode, facultyId: faculty.id },
        });
      }
    }

    console.log(`  ✓ ${uni.name} (${uni.shortCode})`);
  }

  console.log(`\nSeeded ${universities.length} universities.`);

  // ── Seed map data for University of Ilesa ──────────────────────────────────
  const unilesa = await prisma.school.findUnique({ where: { shortCode: 'UNILESA' } });
  if (!unilesa) { console.log('UNILESA not found, skipping map seed.'); return; }

  let systemUser = await prisma.user.findFirst({ where: { email: 'system@schub.app' } });
  if (!systemUser) {
    const faculty = await prisma.faculty.findFirst({ where: { schoolId: unilesa.id } });
    const dept    = await prisma.department.findFirst({ where: { faculty: { schoolId: unilesa.id } } });
    systemUser = await prisma.user.create({
      data: {
        fullName:     'System',
        email:        'system@schub.app',
        matricNumber: 'SYS000000',
        passwordHash: 'n/a',
        role:         'SUPER_ADMIN',
        level:        '100',
        schoolId:     unilesa.id,
        facultyId:    faculty!.id,
        departmentId: dept!.id,
      },
    });
  }

  if (!fs.existsSync(mapGeojsonPath)) {
    console.log(`GeoJSON not found at ${mapGeojsonPath}; skipping map seed.`);
    return;
  }

  // map_locations (simple lat/lng table)
  let rawGeojson: unknown;
  try {
    rawGeojson = JSON.parse(fs.readFileSync(mapGeojsonPath, 'utf-8'));
  } catch {
    console.log('Failed to parse GeoJSON file; skipping map seed.');
    return;
  }

  if (
    typeof rawGeojson !== 'object' || rawGeojson === null ||
    !('features' in rawGeojson) || !Array.isArray((rawGeojson as any).features)
  ) {
    console.log('GeoJSON file is not a valid FeatureCollection; skipping map seed.');
    return;
  }

  const features: Array<{ properties?: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }> =
    (rawGeojson as any).features;

  let created = 0;
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    if (typeof feature !== 'object' || feature === null) continue;
    const center = featureCenter(feature as any);
    if (!center) continue;
    const [longitude, latitude] = center;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

    // Extract only the name — never spread arbitrary properties into the DB
    const rawName = feature.properties?.name ?? feature.properties?.label;
    const name = typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName.trim().slice(0, 200)
      : `UNILESA Building ${i + 1}`;

    await prisma.mapLocation.upsert({
      where: { id: `unilesa-loc-${i + 1}` },
      update: { name, latitude, longitude },
      create: {
        id:          `unilesa-loc-${i + 1}`,
        name,
        type:        'BUILDING',
        tags:        ['building', 'campus'],
        latitude,
        longitude,
        schoolId:    unilesa.id,
        createdById: systemUser.id,
      },
    });
    created++;
  }
  console.log(`\nSeeded ${created} map locations for University of Ilesa.`);

  // ── Seed emergency contacts for University of Ilesa ────────────────────────
  const emergencyContacts = [
    { name: 'Campus Security', role: 'Security Officer', phone: '+2348000000001', category: 'SECURITY' as const, order: 0 },
    { name: 'University Clinic', role: 'Medical Officer', phone: '+2348000000002', category: 'CLINIC' as const, order: 1 },
    { name: 'Student Affairs', role: 'Student Affairs Officer', phone: '+2348000000003', category: 'STUDENT_AFFAIRS' as const, order: 2 },
  ];
  for (const contact of emergencyContacts) {
    await prisma.emergencyContact.upsert({
      where: { id: `unilesa-emergency-${contact.category.toLowerCase()}` },
      update: { phone: contact.phone },
      create: {
        id:          `unilesa-emergency-${contact.category.toLowerCase()}`,
        name:        contact.name,
        role:        contact.role,
        phone:       contact.phone,
        category:    contact.category,
        order:       contact.order,
        schoolId:    unilesa.id,
        createdById: systemUser.id,
      },
    });
  }
  console.log(`Seeded ${emergencyContacts.length} emergency contacts for University of Ilesa.`);

  // campus_features (PostGIS)
  console.log('\nSeeding campus features (PostGIS) for University of Ilesa...');
  const result = await campusGeojsonImportService.importFeaturesFromFile({
    filePath: mapGeojsonPath,
    schoolId: unilesa.id,
  });
  const imported = Math.trunc(Number(result.imported));
  const read     = Math.trunc(Number(result.read));
  const valid    = Math.trunc(Number(result.valid));
  console.log(`  ✓ Imported ${imported} campus features (${read} read, ${valid} valid).`);
}

main()
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[seed] Fatal error:', message.replace(/[\r\n\x00-\x1F\x7F]/g, ' '));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
