import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import { fetchHardwareData } from '../dataFetcher';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.cputemperature' })
export class CPUTemperatureAction extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = true;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Ensures Open Hardware Monitor is running, then starts updating CPU temperature.
   */
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    setTimeout(() => this.updateCPUTemperature(ev), 5000); // Delay for OpenHardwareMonitor startup
    this.interval = setInterval(() => this.updateCPUTemperature(ev), 2000); // Update every 2 seconds
  }

  async updateCPUTemperature(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    const data = await fetchHardwareData();
    if (!data) {
      await ev.action.setTitle('CPU\nN/A'); // Fix: Should be CPU, not GPU
      return;
    }

    const cpuTemp = this.getCPUTemperatureFromData(data); // Fix: Correct variable name
    await ev.action.setTitle(`CPU\n${cpuTemp > 0 ? cpuTemp + '°C' : 'N/A'}`);
  }

  /**
   * Extracts CPU temperature from Open Hardware Monitor JSON data.
   * @param data - The JSON response from Open Hardware Monitor.
   * @returns The CPU temperature in Celsius, or 0 if not found.
   */
  getCPUTemperatureFromData(data: any): number {
    for (const category of data.Children || []) {
      for (const subCategory of category.Children || []) {
        for (const sensor of subCategory.Children || []) {
          if (sensor.Text === 'Temperatures') {
            for (const tempSensor of sensor.Children || []) {
              if (tempSensor.Text === 'CPU Package' && tempSensor.Value) {
                return Math.round(parseFloat(tempSensor.Value));
              }
            }
          }
        }
      }
    }
    return 0; // Return 0 if no valid temperature found
  }

  /**
   * Called when the button is pressed.
   * Toggles CPU temperature monitoring on/off.
   */
  override onKeyDown(ev: KeyDownEvent): void {
    if (this.isMonitoring) {
      // Stop monitoring
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      ev.action.setTitle('CPU\nTemp\nPaused');
    } else {
      // Start monitoring
      this.updateCPUTemperature(ev);
      this.interval = setInterval(() => this.updateCPUTemperature(ev), 1000);
    }

    this.isMonitoring = !this.isMonitoring; // Toggle state
  }

  /**
   * Called when the action disappears from the Stream Deck.
   * Clears the interval to prevent memory leaks.
   */
  override onWillDisappear(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
