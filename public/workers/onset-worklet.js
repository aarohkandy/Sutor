class OnsetProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.mode = "calibration";
    this.noiseFloor = 0.001;
    this.previousRms = 0;
    this.smoothedRms = 0;
    this.lastOnsetTimeMs = -Infinity;
    this.port.onmessage = (event) => {
      if (event.data?.type === "config") {
        this.mode = event.data.mode ?? this.mode;
        this.noiseFloor = event.data.noiseFloor ?? this.noiseFloor;
      }
    };
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) {
      return true;
    }

    let sum = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const sample = channel[index];
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / channel.length);
    let onset = false;

    if (this.mode === "tracking") {
      this.smoothedRms = this.smoothedRms === 0 ? rms : this.smoothedRms * 0.82 + rms * 0.18;
      const delta = rms - this.previousRms;
      const timeMs = (currentFrame / sampleRate) * 1000;
      const minGapMs = (channel.length / sampleRate) * 1000 * 2.5;
      onset =
        rms > this.noiseFloor * 1.25 &&
        delta > Math.max(this.noiseFloor * 0.15, this.smoothedRms * 0.12) &&
        timeMs - this.lastOnsetTimeMs > minGapMs;

      if (onset) {
        this.lastOnsetTimeMs = timeMs;
      }
    }

    this.previousRms = rms;
    this.port.postMessage({
      rms,
      onset,
      timeMs: (currentFrame / sampleRate) * 1000
    });

    return true;
  }
}

registerProcessor("sutor-onset-processor", OnsetProcessor);
