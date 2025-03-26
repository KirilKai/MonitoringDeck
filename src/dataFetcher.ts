import { exec, execSync } from 'child_process';

/**
 * Ensures Open Hardware Monitor is running before fetching data.
 * If OHM is not running, it will attempt to restart it every 30 seconds.
 */
function startOpenHardwareMonitor(): void {
  const checkInterval = 30000;

  const checkAndStartOHM = () => {
    try {
      const result = execSync('tasklist', { encoding: 'utf8' });

      if (!result.includes('OpenHardwareMonitor.exe')) {
        console.log('OpenHardwareMonitor is not running. Starting it now...');
        exec(
          '"C:\\Program Files (x86)\\OpenHardwareMonitor\\OpenHardwareMonitor.exe"',
          (err) => {
            if (err) {
              console.error('Failed to start OpenHardwareMonitor:', err);
            } else {
              console.log('OpenHardwareMonitor started successfully.');
            }
          }
        );
      } else {
        console.log('OpenHardwareMonitor is already running.');
      }
    } catch (error) {
      console.error('Error checking or starting OpenHardwareMonitor:', error);
    }
  };

  // Run check immediately and then set an interval
  checkAndStartOHM();
  setInterval(checkAndStartOHM, checkInterval);
}

// Start monitoring OHM status
startOpenHardwareMonitor();

/**
 * Fetches hardware data from Open Hardware Monitor.
 */
export async function fetchHardwareData(
  retries = 5,
  delayMs = 2000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching hardware data... Attempt ${attempt}`);
      const response = await fetch('http://localhost:8085/data.json');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Object.keys(data).length > 0) {
        console.log(`Data received successfully on attempt ${attempt}.`);
        return data;
      } else {
        console.warn(`Attempt ${attempt}: Data is empty.`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
    }

    if (attempt < retries) {
      console.log(`Retrying in ${delayMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.error('fetchHardwareData(): All retry attempts failed.');
  return null;
}
