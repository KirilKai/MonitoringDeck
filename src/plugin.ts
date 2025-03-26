import streamDeck, { LogLevel } from '@elgato/streamdeck';
import { CPUUtilizationAction } from './actions/cpuUtilization';
import { CPUTemperatureAction } from './actions/cpuTemperature';
import { GPUUtilizationAction } from './actions/gpuUtilization';
import { GPUTemperatureAction } from './actions/gpuTemperature';
import { GPUTemperatureAction2 } from './actions/gpuTemperature2';
import { DownloadSpeedAction } from './actions/downloadSpeed';
import { UploadSpeedAction } from './actions/uploadSpeed';
import { SecretAction } from './actions/secret';

streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the CPU utilization action
streamDeck.actions.registerAction(new CPUUtilizationAction());

// Register the CPU temperature action
streamDeck.actions.registerAction(new CPUTemperatureAction());

// Register the GPU utilization action
streamDeck.actions.registerAction(new GPUUtilizationAction());

// Register the GPU temperature action
streamDeck.actions.registerAction(new GPUTemperatureAction());

// Register the GPU temperature action V2
streamDeck.actions.registerAction(new GPUTemperatureAction2());

// Register the download speed action
streamDeck.actions.registerAction(new DownloadSpeedAction());

// Register the upload speed action
streamDeck.actions.registerAction(new UploadSpeedAction());

// Register the secret action
streamDeck.actions.registerAction(new SecretAction());

// Connect to the Stream Deck
streamDeck.connect();
