// Test script for email functionality
// Run with: node test-email.js

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const testEmailData = {
  name: "Test User",
  email: "test@example.com",
  pps: "1234567T",
  pdfData: "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwMyAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoKMjAzCiUlRU9GCg==", // Sample base64 PDF
  type: 'expense-report'
};

async function testEmailEndpoint() {
  try {
    console.log('Testing email endpoint...');

    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData),
    });

    const result = await response.json();
    console.log('Response:', result);

    if (response.ok) {
      console.log('✅ Email endpoint test successful!');
    } else {
      console.log('❌ Email endpoint test failed!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test when executed directly (works on Windows and POSIX)
// Compare the resolved file path of this module to process.argv[1]
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  testEmailEndpoint();
}