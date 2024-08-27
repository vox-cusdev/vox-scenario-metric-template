export class Metric {
  constructor(config) {
    this.config = config;
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.token)
      this.headers['Authorization'] = `Bearer ${this.config.token}`;
    
    if (this.config.headers)
      this.headers = {...this.headers, ...this.config.headers};
  }
  
  logData() {
    Logger.write(`[LOGGER][METRIC] Метрика текущей сессии: ${JSON.stringify(this.config.data, null, 2)}`);
    return this;
  }
  
  async send() {
    return Net.httpRequestAsync(this.config.url, {
      method: this.config.method,
      postData: JSON.stringify(this.config.data), // данные
      headers: this.headers,
      timeout: 90, // таймаут в секундах
    }).then((result) => Logger.write(`[LOGGER][METRIC][RESPONSE] ${JSON.stringify(result, null, 2)}`)).catch((error) => Logger.write(`[LOGGER][METRIC][ERROR] ${JSON.stringify(error, null, 2)}`));
  }
}
