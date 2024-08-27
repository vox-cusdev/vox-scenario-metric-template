'use strict';

const inConnected = async () => {
  Logger.write('[LOGGER] Попали в connected входящего плеча (входящий звонок)');
};

class Duration {
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

// Глобальный объект с переменными и данными конфигураций
const store = {
  callIn: null, // входящий звонок
  callOut: null, // исходящий звонок
  
  aon: '79998887766', // номер платформы
  
  duration: {
    session: new Duration(),
    connect: new Duration(),
    dialing: new Duration(),
    talk: new Duration(),
  },
  
  beenInFinalActions: false, // были ли в finalActions
  
  metricConfig: {
    url: 'https://url/schema_name',
    method: 'POST',
    data: {},
  },
};

class Metric {
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

// Глобальный объект со статусами для метрики, по ходу сессии данные константы вписываются в объект metric
const statuses = {
  call_status: {
    connected: 'Трубку подняли',
    failed: 'Трубку не подняли',
  },
  call_result: {
    success: 'Разговор состоялся',
    failed: 'Разговор не состоялся',
  },
  hangup_initiator: {
    a: 'Абонент А',
    b: 'Абонент Б',
    vox: 'Voximplant',
  },
};

// Глобальный объект с данными метрики, по ходу сессии заполняем его данными
const metric = Object.seal({
  session_id: null, // id звонка
  call_date_time: null, // дата и время звонка
  duration: null, // длительность звонка (общая)
  destination_a: null, // номер, на который пришел звонок
  phone_a: null, // реальный номер абонента А
  connect_duration: null, // длительность от прихода звонка до начала дозвона абоненту Б
  phone_b: null, // реальный номер абонента Б
  destination_b: null, // номер, с которого звоним абоненту Б
  duration_dialing_time: null, // длительность дозвона
  call_status: null, // статус дозвона
  call_status_code: null, // код дозвона
  call_result: statuses.call_result.failed, // статус соединения
  hangup_initiator: null, // кто бросил трубку
  duration_talk: null, // длительность разговора
  record_url: null, // ссылка на запись
  log_url: null, // лог звонка
});

const finalActions = async () => {
  // Финальный метод сессии, тут в основном идут отправки данных в СРМ и прочие финальные вычисления/отправки данных.
  if (store.beenInFinalActions) return;
  store.beenInFinalActions = true;
  
  Logger.write('[LOGGER] Попали в finalActions');
  
  // Записываем время длительности сессии
  metric.duration = store.duration.session.endTime().duration();
  // Записываем время длительности разговора
  metric.duration_talk = store.duration.talk.endTime().duration();
  
  // Оправляем метрику в СРМ
  await new Metric({...store.metricConfig, ...{data: metric}}).logData().send();
  
  // Завершаем сессию
  VoxEngine.terminate();
};

const inDisconnected = async () => {
  Logger.write('[LOGGER] Попали в disconnected входящего плеча (входящий звонок)');
  
  // Вписываем инициатора сброса звонка. По умолчанию значение полей null, потому тот, кто первым сбросит - того результат и запишется и в дальнейшем не будет перезаписи данного поля
  if (!metric.hangup_initiator) metric.hangup_initiator = statuses.hangup_initiator.a;
  
  // Запускаем метод завершения сессии
  await finalActions();
};

const outConnected = async () => {
  Logger.write('[LOGGER] Попали в connected исходящего плеча (исходящий звонок)');
  
  // Вписываем код 200 - т.к. успешно соединились с исходящим плечом
  metric.call_status_code = 200;
  // Проставляем статус успешного коннекта
  metric.call_status = statuses.call_status.connected;
  // Записываем время за которое дозвонились до исходящего плеча
  metric.duration_dialing_time = store.duration.dialing.endTime().duration();
  
  // Запускаем запись звонка и вешаем события по которому получим ссылку на запись звонка
  store.callOut.addEventListener(CallEvents.RecordStarted, ({url}) => metric.record_url = url);
  store.callOut.record({stereo: true});
  
  // Соединяем входящие и исходящее плечо
  VoxEngine.sendMediaBetween(store.callOut, store.callIn);
  
  store.duration.talk.startTime();
  // Увы, нет события, которое скажет нам о том, что соединение обоих плеч прошло успешно, потому остается вписывать данные статус только после метода sendMediaBetween
  metric.call_result = statuses.call_result.success;
};

const outDisconnected = async () => {
  Logger.write('[LOGGER] Попали в disconnected исходящего плеча (исходящий звонок)');
  
  // Вписываем инициатора сброса звонка. По умолчанию значение полей null, потому тот, кто первым сбросит - того результат и запишется и в дальнейшем не будет перезаписи данного поля
  if (!metric.hangup_initiator) metric.hangup_initiator = statuses.hangup_initiator.b;
  
  // Запускаем метод завершения сессии
  await finalActions();
};

const outFailed = async ({code}) => {
  Logger.write('[LOGGER] Попали в failed исходящего плеча (исходящий звонок)');
  //Записываем код фейла звонка, забираем из результирующего объекта фейла.
  metric.call_status_code = code;
  // Прописываем фейл статусы
  metric.call_status = statuses.call_status.failed;
  // Вписываем инициатора сброса звонка. По умолчанию значение полей null, потому тот, кто первым сбросит - того результат и запишется и в дальнейшем не будет перезаписи данного поля
  if (!metric.hangup_initiator) metric.hangup_initiator = statuses.hangup_initiator.vox;
  
  // Запускаем метод завершения сессии
  await finalActions();
};

class Utils {
  static callOut(phone) {
    metric.connect_duration = store.duration.connect.endTime().duration();
    store.duration.dialing.startTime();
    
    metric.phone_b = phone;
    metric.destination_b = store.aon;
    
    store.callOut = VoxEngine.callPSTN(phone, store.aon);
    
    store.callOut.addEventListener(CallEvents.Connected, outConnected);
    store.callOut.addEventListener(CallEvents.Disconnected, outDisconnected);
    store.callOut.addEventListener(CallEvents.Failed, outFailed);
  }
  
  static getCallDateTime(options) {
    const {utc = 0} = options || {};
    const date = new Date();
    if (utc) {
      date.setHours(date.getHours() + utc);
    }
    return date.toJSON().slice(0, -5).replace(/T/, ' ');
  }
  
  static mapProps(fromObject, toObject) {
    for (const field in fromObject) {
      if (Object.prototype.hasOwnProperty.call(toObject, field)) {
        toObject[field] = fromObject[field];
      }
    }
    
    return toObject;
  }
}

VoxEngine.addEventListener(AppEvents.Started, async (callData) => {
  // Идентификатор сессии
  metric.session_id = callData.sessionId;
  // Время старта сессии
  metric.call_date_time = Utils.getCallDateTime({utc: 0});
  // Лог сессии
  metric.log_url = callData.logURL;
  
  store.duration.session.startTime();
  store.duration.connect.startTime();
  
  // Если кастом дата не пришла - входящий
  if (!VoxEngine.customData()) return;
  
  const customData = JSON.parse(VoxEngine.customData());
  
  // Присваиваем значения из customData в такие же поля в metric
  Object.assign(metric, Utils.mapProps(customData, metric));
  
  // Запускаем исходящий звонок
  Utils.callOut(metric.phone_b);
});

VoxEngine.addEventListener(AppEvents.CallAlerting, (callData) => {
  // Объект текущего звонка
  store.callIn = callData.call;
  
  // Кто звонит
  metric.phone_a = callData.callerid;
  // На какой номер звонит
  metric.destination_a = callData.destination;
  
  // Инициализируем события коннекта и дисконнекта входящего плеча и поднимаем трубку
  store.callIn.addEventListener(CallEvents.Connected, inConnected);
  store.callIn.addEventListener(CallEvents.Disconnected, inDisconnected);
  store.callIn.answer();
  
  // Запускаем исходящий звонок
  Utils.callOut(callData.destination);
});
