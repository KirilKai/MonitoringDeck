import si from 'systeminformation';

async function testCPUTemperature() {
  try {
    console.log('Fetching CPU temperature...');
    const tempData = await si.cpuTemperature();
    console.log('CPU Temperature Data:', tempData);
  } catch (error) {
    console.error('Failed to get CPU temperature:', error);
  }
}

testCPUTemperature();
// node cputemptest.js
