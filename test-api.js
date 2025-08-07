#!/usr/bin/env node

// Simple API test script
const BASE_URL = 'http://localhost:5173'

async function testEndpoint(method, path, data = null) {
  const url = `${BASE_URL}${path}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  if (data) {
    options.body = JSON.stringify(data)
  }
  
  try {
    const response = await fetch(url, options)
    const result = await response.json()
    console.log(`${method} ${path}:`, response.status, result)
    return result
  } catch (error) {
    console.error(`${method} ${path} failed:`, error.message)
    return null
  }
}

async function runTests() {
  console.log('🧪 Testing Prescriptions API...\n')
  
  // Health check
  await testEndpoint('GET', '/health')
  
  // Test diseases
  console.log('\n📋 Testing Diseases API:')
  await testEndpoint('GET', '/api/diseases')
  await testEndpoint('GET', '/api/diseases/1')
  
  // Test medications
  console.log('\n💊 Testing Medications API:')
  await testEndpoint('GET', '/api/medications')
  await testEndpoint('GET', '/api/medications/1')
  
  // Test prescriptions
  console.log('\n📝 Testing Prescriptions API:')
  await testEndpoint('GET', '/api/prescriptions')
  await testEndpoint('GET', '/api/prescriptions/1')
  
  // Test search
  console.log('\n🔍 Testing Search API:')
  await testEndpoint('POST', '/api/search', {
    query: 'cold',
    type: 'all'
  })
  
  // Test config
  console.log('\n⚙️ Testing Config API:')
  await testEndpoint('GET', '/api/config/ai_enabled')
  
  console.log('\n✅ API tests completed!')
}

// Run the tests
runTests().catch(console.error)
