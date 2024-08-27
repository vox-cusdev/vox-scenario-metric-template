export class Duration {
  constructor() {
    this._startTime = null;
    this._endTime = null;
  }

  startTime() {
    this._startTime = new Date().getTime();
    return this;
  }

  endTime() {
    this._endTime = new Date().getTime();
    return this;
  }

  duration() {
    return this._startTime > 0 ? Math.round((this._endTime - this._startTime) / 1000) : null;
  }
}
