/**
 * FEC Donations Data Seeder
 *
 * Seeds the database with sample FEC (Federal Election Commission) donation records.
 * In production, this would bulk-load actual FEC data files.
 */

import { PrismaClient } from '@prisma/client';
import { metaphone } from '@juries/utils';

const prisma = new PrismaClient();

interface FECDonationInput {
  donorName: string;
  firstName?: string;
  lastName?: string;
  city: string;
  state: string;
  zip: string;
  employer?: string;
  occupation?: string;
  recipientName: string;
  recipientId: string;
  recipientType: string;
  recipientParty?: string;
  amount: number;
  date: string;
}

// Sample FEC donation records for testing
const sampleDonations: FECDonationInput[] = [
  {
    donorName: 'MARIA L GARCIA',
    firstName: 'MARIA',
    lastName: 'GARCIA',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90015',
    employer: 'LA County Hospital',
    occupation: 'Registered Nurse',
    recipientName: 'Biden for President',
    recipientId: 'C00703975',
    recipientType: 'Presidential',
    recipientParty: 'Democrat',
    amount: 250,
    date: '2020-09-15',
  },
  {
    donorName: 'MICHAEL BROWN',
    firstName: 'MICHAEL',
    lastName: 'BROWN',
    city: 'Santa Monica',
    state: 'CA',
    zip: '90401',
    employer: 'Brown & Partners LLP',
    occupation: 'Attorney',
    recipientName: 'ACLU',
    recipientId: 'C00000000',
    recipientType: 'PAC',
    recipientParty: 'Non-partisan',
    amount: 500,
    date: '2021-03-10',
  },
  {
    donorName: 'MICHAEL BROWN',
    firstName: 'MICHAEL',
    lastName: 'BROWN',
    city: 'Santa Monica',
    state: 'CA',
    zip: '90401',
    employer: 'Brown & Partners LLP',
    occupation: 'Attorney',
    recipientName: 'Warren for President',
    recipientId: 'C00693234',
    recipientType: 'Presidential',
    recipientParty: 'Democrat',
    amount: 1000,
    date: '2019-08-15',
  },
  {
    donorName: 'DAVID LEE',
    firstName: 'DAVID',
    lastName: 'LEE',
    city: 'Glendale',
    state: 'CA',
    zip: '91201',
    employer: 'Lee Electronics',
    occupation: 'Business Owner',
    recipientName: 'Trump for President',
    recipientId: 'C00580100',
    recipientType: 'Presidential',
    recipientParty: 'Republican',
    amount: 2800,
    date: '2020-06-20',
  },
  {
    donorName: 'SARAH CHEN',
    firstName: 'SARAH',
    lastName: 'CHEN',
    city: 'Irvine',
    state: 'CA',
    zip: '92602',
    employer: 'Google',
    occupation: 'Data Scientist',
    recipientName: 'Democratic National Committee',
    recipientId: 'C00010603',
    recipientType: 'National Committee',
    recipientParty: 'Democrat',
    amount: 500,
    date: '2020-10-01',
  },
  {
    donorName: 'ROBERT JOHNSON',
    firstName: 'ROBERT',
    lastName: 'JOHNSON',
    city: 'Long Beach',
    state: 'CA',
    zip: '90802',
    employer: 'US Navy (Retired)',
    occupation: 'Retired',
    recipientName: 'Republican National Committee',
    recipientId: 'C00003418',
    recipientType: 'National Committee',
    recipientParty: 'Republican',
    amount: 1000,
    date: '2020-08-15',
  },
  {
    donorName: 'JOHN SMITH',
    firstName: 'JOHN',
    lastName: 'SMITH',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    employer: 'Tech Corp',
    occupation: 'Software Engineer',
    recipientName: 'Tech PAC',
    recipientId: 'C00000001',
    recipientType: 'PAC',
    recipientParty: 'Non-partisan',
    amount: 100,
    date: '2021-05-01',
  },
  {
    donorName: 'JENNIFER MARTINEZ',
    firstName: 'JENNIFER',
    lastName: 'MARTINEZ',
    city: 'Burbank',
    state: 'CA',
    zip: '91501',
    employer: 'Disney',
    occupation: 'Marketing Manager',
    recipientName: 'California Democratic Party',
    recipientId: 'C00000002',
    recipientType: 'State Committee',
    recipientParty: 'Democrat',
    amount: 300,
    date: '2022-01-10',
  },
  {
    donorName: 'MARIA GARCIA',
    firstName: 'MARIA',
    lastName: 'GARCIA',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    employer: 'LA County Hospital',
    occupation: 'Nurse',
    recipientName: 'Healthcare Workers PAC',
    recipientId: 'C00000003',
    recipientType: 'PAC',
    recipientParty: 'Non-partisan',
    amount: 150,
    date: '2021-11-20',
  },
];

async function seedFECDonations() {
  console.log('💰 Seeding FEC donation records...');

  // Get or create LA County venue
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
        fecDonationCount: sampleDonations.length,
      },
    });
    console.log(`✓ Created venue: ${venue.name}`);
  }

  // Delete existing FEC donations for this venue
  const deleted = await prisma.fECDonation.deleteMany({
    where: { venueId: venue.id },
  });
  console.log(`✓ Deleted ${deleted.count} existing FEC donations`);

  // Insert new donation records
  let inserted = 0;
  for (const donation of sampleDonations) {
    // Generate metaphone code for phonetic search
    const nameMetaphone = donation.firstName && donation.lastName
      ? `${metaphone(donation.firstName)}${metaphone(donation.lastName)}`
      : metaphone(donation.donorName);

    // Parse date and extract election cycle
    const transactionDate = new Date(donation.date);
    const electionCycle = transactionDate.getFullYear();

    // Generate unique FEC ID
    const fecId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    await prisma.fECDonation.create({
      data: {
        venueId: venue.id,
        fecId,
        donorName: donation.donorName,
        donorNameFirst: donation.firstName,
        donorNameLast: donation.lastName,
        nameMetaphone,
        donorCity: donation.city,
        donorState: donation.state,
        donorZipCode: donation.zip,
        donorEmployer: donation.employer,
        donorOccupation: donation.occupation,
        recipientName: donation.recipientName,
        recipientParty: donation.recipientParty,
        recipientOffice: donation.recipientType,
        amount: donation.amount,
        transactionDate,
        electionCycle,
      },
    });

    inserted++;
  }

  console.log(`✓ Inserted ${inserted} FEC donation records`);
  console.log(`✅ FEC donations seeding complete!`);
}

async function main() {
  try {
    await seedFECDonations();
  } catch (error) {
    console.error('❌ Error seeding FEC donations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
