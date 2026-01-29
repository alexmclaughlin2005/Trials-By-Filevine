#!/usr/bin/env tsx
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function checkDocumentAttachments() {
  // Find the document we just created
  const doc = await prisma.importedDocument.findFirst({
    where: { filename: 'Case_Management_Order-20130306_0.pdf' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!doc) {
    console.log('❌ Document not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('📄 Document found:');
  console.log('   ID:', doc.id);
  console.log('   Filename:', doc.filename);
  console.log('   Text Extraction Status:', doc.textExtractionStatus);
  console.log('   Extracted Text URL:', doc.extractedTextUrl);
  console.log('   Extracted Text Chars:', doc.extractedTextChars);
  
  // Check if it's attached to any arguments
  const attachments = await prisma.argumentDocument.findMany({
    where: { documentId: doc.id },
    include: { argument: true }
  });
  
  console.log('');
  console.log('📎 Attachments:', attachments.length);
  attachments.forEach(a => {
    console.log('   - Argument:', a.argument.title, '(ID:', a.argument.id + ')');
  });
  
  // List all arguments for the case
  const caseId = '4c3422dc-748f-4b01-9287-17a556ea4c84';
  const caseArguments = await prisma.caseArgument.findMany({
    where: { caseId },
    select: { id: true, title: true }
  });
  
  console.log('');
  console.log('📋 Arguments in case:', caseArguments.length);
  caseArguments.forEach(a => {
    console.log('   -', a.title, '(ID:', a.id + ')');
  });
  
  await prisma.$disconnect();
}

checkDocumentAttachments().catch(console.error);
