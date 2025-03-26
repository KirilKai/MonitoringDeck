import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from '@elgato/streamdeck';
import { fetchHardwareData } from '../dataFetcher';

@action({ UUID: 'com.kiril-kaikov.monitoringdeck.gputemperature2' })
export class GPUTemperatureAction2 extends SingletonAction {
  private interval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = true;
  private lastKnownGPUTemp: number | null = null;

  constructor() {
    super();
  }

  /**
   * Called when the action appears on the Stream Deck.
   * Ensures Open Hardware Monitor is running and starts monitoring GPU temperature.
   */
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    setTimeout(() => this.updateGPUTemperature2(ev), 10000);
    this.interval = setInterval(() => this.updateGPUTemperature2(ev), 2000);
  }

  /**
   * Fetches GPU temperature from Open Hardware Monitor and updates the Stream Deck button.
   * If no valid data is available, it shows "Sleep Mode".
   */
  async updateGPUTemperature2(
    ev: WillAppearEvent | KeyDownEvent
  ): Promise<void> {
    try {
      console.log('Fetching hardware data...');
      const data = await fetchHardwareData();

      if (!data) {
        console.error('fetchHardwareData() returned null or undefined.');

        if (this.lastKnownGPUTemp !== null) {
          console.log(`Using last known GPU temp: ${this.lastKnownGPUTemp}°C`);
          await ev.action.setTitle(`GPU\n${this.lastKnownGPUTemp}°C`);
        } else {
          await ev.action.setTitle('GPU\nN/A');
        }
        return;
      }

      console.log('Received hardware data:', JSON.stringify(data, null, 2));
      const gpuTemp = this.getGPUTemperatureFromData(data);

      if (gpuTemp > 0) {
        this.lastKnownGPUTemp = gpuTemp; // Save valid temperature
        await ev.action.setTitle(`GPU\n${gpuTemp}°C`);
      } else {
        console.warn('GPU temperature unavailable.');

        if (this.lastKnownGPUTemp !== null) {
          console.log(`Using last known GPU temp: ${this.lastKnownGPUTemp}°C`);
          await ev.action.setTitle(`GPU\n${this.lastKnownGPUTemp}°C`);
        } else {
          await ev.action.setTitle('GPU\nN/A');
        }
      }
    } catch (error) {
      console.error('Error in updateGPUTemperature:', error);

      if (this.lastKnownGPUTemp !== null) {
        console.log(`Using last known GPU temp: ${this.lastKnownGPUTemp}°C`);
        await ev.action.setTitle(`GPU\n${this.lastKnownGPUTemp}°C`);
      } else {
        await ev.action.setTitle('GPU\nError');
      }
    }
  }

  /**
   * Extracts the GPU temperature value from the hardware data JSON.
   */
  getGPUTemperatureFromData(data: any): number {
    for (const category of data.Children || []) {
      for (const subCategory of category.Children || []) {
        for (const sensor of subCategory.Children || []) {
          if (sensor.Text === 'Temperatures') {
            for (const tempSensor of sensor.Children || []) {
              if (tempSensor.Text.includes('GPU') && tempSensor.Value) {
                return Math.round(parseFloat(tempSensor.Value));
              }
            }
          }
        }
      }
    }
    return 0;
  }

  /**
   * Handles button press: pauses/resumes monitoring.
   */
  override onKeyDown(ev: KeyDownEvent): void {
    if (this.isMonitoring) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      ev.action.setTitle('GPU\nTemp\nPaused');
    } else {
      this.updateGPUTemperature2(ev);
      this.interval = setInterval(() => this.updateGPUTemperature2(ev), 1000);
    }

    this.isMonitoring = !this.isMonitoring;
  }

  /**
   * Stops monitoring when the button disappears from the Stream Deck.
   */
  override onWillDisappear(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
