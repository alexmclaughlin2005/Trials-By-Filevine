import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Local PDF extraction test script
 *
 * Usage:
 * 1. Place a test PDF in test-pdfs/sample.pdf
 * 2. Run: npm run test:pdf-extraction
 */

async function testPdfExtraction() {
  console.log('🔍 Testing PDF extraction locally...\n');

  // Check if test PDF exists
  const testPdfPath = join(process.cwd(), 'test-pdfs', 'sample.pdf');

  try {
    const pdfBuffer = readFileSync(testPdfPath);
    console.log(`✅ Found test PDF: ${testPdfPath}`);
    console.log(`📄 File size: ${pdfBuffer.length} bytes\n`);

    // Try different ways to load pdf-parse
    console.log('Testing pdf-parse module loading...\n');

    // Method 1: Direct require
    try {
      console.log('Method 1: Direct require()');
      const pdfParse1 = require('pdf-parse');
      console.log(`  Type: ${typeof pdfParse1}`);
      console.log(`  Keys: ${Object.keys(pdfParse1).slice(0, 10).join(', ')}`);

      if (typeof pdfParse1 === 'function') {
        console.log('  ✅ Direct call available');
        const result = await pdfParse1(pdfBuffer);
        console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
        console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
        return;
      }
    } catch (error: any) {
      console.log(`  ❌ Method 1 failed: ${error.message}\n`);
    }

    // Method 2: .default
    try {
      console.log('Method 2: require().default');
      const pdfParseModule2 = require('pdf-parse');
      const pdfParse2 = pdfParseModule2.default;
      console.log(`  Type: ${typeof pdfParse2}`);

      if (typeof pdfParse2 === 'function') {
        console.log('  ✅ .default call available');
        const result = await pdfParse2(pdfBuffer);
        console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
        console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
        return;
      }
    } catch (error: any) {
      console.log(`  ❌ Method 2 failed: ${error.message}\n`);
    }

    // Method 3: ES6 import (dynamic)
    try {
      console.log('Method 3: Dynamic import()');
      const pdfParseModule3 = await import('pdf-parse');
      console.log(`  Module keys: ${Object.keys(pdfParseModule3).join(', ')}`);

      // Try default export
      if (pdfParseModule3.default) {
        console.log(`  default type: ${typeof pdfParseModule3.default}`);
        if (typeof pdfParseModule3.default === 'function') {
          console.log('  ✅ Dynamic import default available');
          const result = await pdfParseModule3.default(pdfBuffer);
          console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
          console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
          return;
        }
      }
    } catch (error: any) {
      console.log(`  ❌ Method 3 failed: ${error.message}\n`);
    }

    // Method 4: Check for named exports
    try {
      console.log('Method 4: Check named exports');
      const pdfParseModule4 = require('pdf-parse');
      console.log(`  All keys: ${Object.keys(pdfParseModule4).join(', ')}`);

      // Check each key
      for (const key of Object.keys(pdfParseModule4)) {
        console.log(`  ${key}: ${typeof pdfParseModule4[key]}`);
        if (typeof pdfParseModule4[key] === 'function' && key !== 'constructor') {
          try {
            console.log(`  Trying ${key}()...`);
            const result = await pdfParseModule4[key](pdfBuffer);
            if (result && result.text) {
              console.log(`  ✅ ${key}() works!`);
              console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
              console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
              return;
            }
          } catch (error: any) {
            console.log(`  ${key}() failed: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`  ❌ Method 4 failed: ${error.message}\n`);
    }

    // Method 5: Try PDFParse as a class with new
    try {
      console.log('Method 5: new PDFParse()');
      const { PDFParse } = require('pdf-parse');
      console.log(`  PDFParse type: ${typeof PDFParse}`);

      const parser = new PDFParse(pdfBuffer);
      console.log(`  Parser instance created: ${typeof parser}`);
      console.log(`  Parser methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(parser)).join(', ')}`);

      // Try to call a parse method
      if (typeof parser.parse === 'function') {
        console.log('  Trying parser.parse()...');
        const result = await parser.parse();
        if (result && result.text) {
          console.log(`  ✅ new PDFParse().parse() works!`);
          console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
          console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
          return;
        }
      }

      // Try to call other methods
      for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(parser))) {
        if (typeof parser[method] === 'function' && method !== 'constructor') {
          try {
            console.log(`  Trying parser.${method}()...`);
            const result = await parser[method]();
            if (result && result.text) {
              console.log(`  ✅ parser.${method}() works!`);
              console.log(`  📝 Extracted ${result.text.length} characters from ${result.numpages} pages`);
              console.log(`  Preview: "${result.text.substring(0, 100)}..."\n`);
              return;
            }
          } catch (error: any) {
            console.log(`  parser.${method}() failed: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`  ❌ Method 5 failed: ${error.message}\n`);
    }

    console.log('❌ All methods failed. Cannot extract PDF text.');

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`❌ Test PDF not found at: ${testPdfPath}`);
      console.log('\n📝 To use this test:');
      console.log('1. Place a PDF file at: test-pdfs/sample.pdf');
      console.log('2. Run: npm run test:pdf-extraction\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testPdfExtraction().catch(console.error);
