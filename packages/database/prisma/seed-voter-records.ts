/**
 * Voter Records Data Seeder
 *
 * Seeds the database with sample voter registration data for testing.
 * In production, this would bulk-load actual voter files from state/county sources.
 */

import { PrismaClient } from '@prisma/client';
import { metaphone } from '@trialforge/utils';

const prisma = new PrismaClient();

interface VoterRecordInput {
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  dob?: string;
  address: string;
  city: string;
  zip: string;
  party?: string;
  registrationDate?: string;
  voteHistory?: string[];
}

// Sample voter records for testing (Los Angeles County, CA)
const sampleVoterRecords: VoterRecordInput[] = [
  {
    fullName: 'MICHAEL BROWN',
    firstName: 'MICHAEL',
    lastName: 'BROWN',
    dob: '1998-03-15',
    address: '1234 Sunset Blvd',
    city: 'Hollywood',
    zip: '90028',
    party: 'Independent',
    registrationDate: '2016-09-01',
    voteHistory: ['2020', '2022'],
  },
  {
    fullName: 'MARIA GARCIA',
    firstName: 'MARIA',
    lastName: 'GARCIA',
    dob: '1989-07-22',
    address: '5678 Main St',
    city: 'Los Angeles',
    zip: '90012',
    party: 'Democrat',
    registrationDate: '2008-10-15',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
  {
    fullName: 'MARIA L GARCIA',
    firstName: 'MARIA',
    lastName: 'GARCIA',
    middleName: 'L',
    dob: '1989-07-22',
    address: '5678 Main St Apt 2',
    city: 'Los Angeles',
    zip: '90015',
    party: 'Democrat',
    registrationDate: '2008-10-15',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
  {
    fullName: 'JOHN SMITH',
    firstName: 'JOHN',
    lastName: 'SMITH',
    dob: '1982-11-05',
    address: '9012 Wilshire Blvd',
    city: 'Los Angeles',
    zip: '90012',
    party: 'Independent',
    registrationDate: '2000-11-01',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
  {
    fullName: 'JOHN A SMITH',
    firstName: 'JOHN',
    lastName: 'SMITH',
    middleName: 'A',
    dob: '1981-05-12',
    address: '345 Broadway',
    city: 'Los Angeles',
    zip: '90013',
    party: 'Democrat',
    registrationDate: '1999-10-01',
    voteHistory: ['2016', '2020'],
  },
  {
    fullName: 'JON SMITH',
    firstName: 'JON',
    lastName: 'SMITH',
    dob: '1983-01-20',
    address: '678 Colorado Blvd',
    city: 'Pasadena',
    zip: '91101',
    party: 'Republican',
    registrationDate: '2001-09-15',
    voteHistory: ['2018', '2020', '2022'],
  },
  {
    fullName: 'ROBERT JOHNSON',
    firstName: 'ROBERT',
    lastName: 'JOHNSON',
    dob: '1966-08-30',
    address: '234 Ocean Blvd',
    city: 'Long Beach',
    zip: '90802',
    party: 'Republican',
    registrationDate: '1984-10-01',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
  {
    fullName: 'SARAH CHEN',
    firstName: 'SARAH',
    lastName: 'CHEN',
    dob: '1995-12-08',
    address: '890 Irvine Center Dr',
    city: 'Irvine',
    zip: '92602',
    party: 'Independent',
    registrationDate: '2013-11-01',
    voteHistory: ['2020', '2022'],
  },
  {
    fullName: 'MICHAEL BROWN',
    firstName: 'MICHAEL',
    lastName: 'BROWN',
    dob: '1979-06-15',
    address: '567 Main St',
    city: 'Santa Monica',
    zip: '90401',
    party: 'Democrat',
    registrationDate: '1997-10-01',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
  {
    fullName: 'JENNIFER MARTINEZ',
    firstName: 'JENNIFER',
    lastName: 'MARTINEZ',
    dob: '1986-04-10',
    address: '123 Olive Ave',
    city: 'Burbank',
    zip: '91501',
    party: 'Independent',
    registrationDate: '2004-09-01',
    voteHistory: ['2020', '2022'],
  },
  {
    fullName: 'DAVID LEE',
    firstName: 'DAVID',
    lastName: 'LEE',
    dob: '1972-09-25',
    address: '456 Brand Blvd',
    city: 'Glendale',
    zip: '91201',
    party: 'Republican',
    registrationDate: '1990-10-01',
    voteHistory: ['2016', '2018', '2020', '2022'],
  },
];

async function seedVoterRecords() {
  console.log('🗳️  Seeding voter records...');

  // Create or get LA County venue
  let venue = await prisma.venue.findFirst({
    where: {
      name: 'Los Angeles Superior Court',
    },
  });

  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: 'Los Angeles Superior Court',
        county: 'Los Angeles',
        state: 'CA',
        courtType: 'state',
        voterRecordCount: sampleVoterRecords.length,
      },
    });
    console.log(`✓ Created venue: ${venue.name}`);
  }

  // Delete existing voter records for this venue
  const deleted = await prisma.voterRecord.deleteMany({
    where: { venueId: venue.id },
  });
  console.log(`✓ Deleted ${deleted.count} existing voter records`);

  // Insert new voter records
  let inserted = 0;
  for (const record of sampleVoterRecords) {
    // Calculate birth year and age from DOB
    const birthYear = record.dob
      ? parseInt(record.dob.split('-')[0])
      : null;
    const age = birthYear
      ? new Date().getFullYear() - birthYear
      : null;

    // Generate metaphone code for phonetic search
    const nameMetaphone = `${metaphone(record.firstName)}${metaphone(record.lastName)}`;

    // Parse registration date
    const registrationDate = record.registrationDate
      ? new Date(record.registrationDate)
      : null;

    await prisma.voterRecord.create({
      data: {
        venueId: venue.id,
        fullName: record.fullName,
        firstName: record.firstName,
        lastName: record.lastName,
        middleName: record.middleName,
        nameMetaphone,
        birthYear,
        age,
        address: record.address,
        city: record.city,
        zipCode: record.zip,
        party: record.party,
        registrationDate,
        votingHistory: record.voteHistory || [],
      },
    });

    inserted++;
  }

  console.log(`✓ Inserted ${inserted} voter records`);
  console.log(`✅ Voter records seeding complete!`);
}

async function main() {
  try {
    await seedVoterRecords();
  } catch (error) {
    console.error('❌ Error seeding voter records:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
