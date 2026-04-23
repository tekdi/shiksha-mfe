#!/usr/bin/env node

/**
 * Example script to demonstrate S3 URL parsing
 * Run with: node s3-example.js
 */

// Import the utilities (you'll need to adjust the import path based on your setup)
const { parseS3Url, getS3InfoFromEnv, COMMON_S3_URLS, PARSED_S3_URLS } = require('./src/utils/s3Utils');

console.log('=== S3 URL Parsing Examples ===\n');

// Example 1: Parse common S3 URLs from the codebase
console.log('1. Common S3 URLs from codebase:');
console.log('================================');

Object.entries(COMMON_S3_URLS).forEach(([name, url]) => {
  const parsed = parseS3Url(url);
  console.log(`\n${name}:`);
  console.log(`  URL: ${url}`);
  console.log(`  Bucket: ${parsed.bucketName}`);
  console.log(`  Region: ${parsed.region}`);
  console.log(`  Path: ${parsed.path}`);
  console.log(`  Is S3: ${parsed.isS3Url}`);
});

// Example 2: Parse your specific URL
console.log('\n\n2. Your specific URL:');
console.log('====================');

const yourUrl = 'http://localhost:3002/assets/public/content/html/do_214403070675165184157-snapshot/index.html';
const parsed = parseS3Url(yourUrl);

console.log(`URL: ${yourUrl}`);
console.log(`Bucket: ${parsed.bucketName}`);
console.log(`Region: ${parsed.region}`);
console.log(`Path: ${parsed.path}`);
console.log(`Is S3: ${parsed.isS3Url}`);

// Example 3: Parse environment variable
console.log('\n\n3. Environment Variable:');
console.log('========================');

const envInfo = getS3InfoFromEnv();
console.log(`Environment URL: ${process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL || 'Not set'}`);
console.log(`Bucket: ${envInfo.bucketName}`);
console.log(`Region: ${envInfo.region}`);
console.log(`Path: ${envInfo.path}`);
console.log(`Is S3: ${envInfo.isS3Url}`);

// Example 4: Different S3 URL formats
console.log('\n\n4. Different S3 URL Formats:');
console.log('============================');

const testUrls = [
  'https://my-bucket.s3.us-east-1.amazonaws.com/path/to/file.html',
  'https://s3.us-east-1.amazonaws.com/my-bucket/path/to/file.html',
  'https://my-bucket.s3.amazonaws.com/path/to/file.html',
  'https://my-bucket.s3-ap-south-1.amazonaws.com/content/html/file.html',
  'https://example.com/not-s3-url/path/file.html'
];

testUrls.forEach((url, index) => {
  const parsed = parseS3Url(url);
  console.log(`\n${index + 1}. ${url}`);
  console.log(`   Bucket: ${parsed.bucketName}`);
  console.log(`   Region: ${parsed.region}`);
  console.log(`   Path: ${parsed.path}`);
  console.log(`   Is S3: ${parsed.isS3Url}`);
});

console.log('\n\n=== Usage in Your Application ===');
console.log(`
// In your API route or component:
import { parseS3Url, getS3InfoFromEnv } from '@workspace/utils/s3Utils';

// Get S3 info from environment
const s3Info = getS3InfoFromEnv();
console.log('Bucket:', s3Info.bucketName);
console.log('Region:', s3Info.region);

// Parse any S3 URL
const parsed = parseS3Url('https://my-bucket.s3.us-east-1.amazonaws.com/path/file.html');
console.log('Bucket:', parsed.bucketName); // 'my-bucket'
console.log('Path:', parsed.path); // 'path/file.html'
console.log('Region:', parsed.region); // 'us-east-1'
`);
