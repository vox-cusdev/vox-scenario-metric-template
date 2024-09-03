'use strict';

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
  session_date_time: null, // Дата и время звонка
  duration_session: null, // Длительность звонка (общая)
  duration_session_before_call: null, // Длительность сессии до начала исходящего звонка
  duration_dialing: null, // Длительность дозвона
  duration_talk: null, // Длительность разговора
  phone_a: null, // Реальный номер абонента А
  destination_a: null, // Номер, на который пришел звонок
  phone_b: null, // Реальный номер абонента Б
  destination_b: null, // Номер, с которого звоним абоненту Б
  custom_data: null, // Дополнительный объект данных при входящем звонке, берем из VoxEngine.customData()
  calls_data: [], // Массив данных звонков в сессии
  call_status: null, // Статус дозвона
  call_status_code: null, // Код дозвона
  call_result: statuses.call_result.failed, // Статус соединения
  hangup_initiator: null, // Кто бросил трубку
  record_url: null, // Ссылка на запись
  log_url: null, // Лог звонка
});

// Шаблон объекта данных для сбора данных входящего/исходящего плеча
const callDataTemplate = Object.seal({
  call_id: null, // Идентификатор плеча
  duration: null, // Длительность плеча
  incoming: null, // Входящий?
  start_time: null, // Время старта звонка
  successful: null, // Ответили на входящее плечо?
  caller_id: null, // С какого номера пришёл звонок
  destination: null, // На какой номер пришёл звонок
  remote_number_type: null, // Тип звонка
});

// Глобальный объект с переменными и данными конфигураций
const store = {
  callIn: null, // Входящий звонок
  callOut: null, // Исходящий звонок
  
  callInData: Object.assign({}, callDataTemplate),
  callOutData: Object.assign({}, callDataTemplate),
  
  aon: '79011477211', // Номер платформы
  username: 'test', // Имя пользователя (vox платформа -> приложение -> пользователи)
  
  duration: {
    session: new Duration(),
    session_before_call: new Duration(),
    dialing: new Duration(),
    talk: new Duration(),
  },
  
  beenInFinalActions: false, // Были ли в finalActions
  
  metricConfig: {
    url: 'https://url/schema_name',
    method: 'POST',
    data: {},
  },
};

const inConnected = async () => {
  Logger.write('[LOGGER] Попали в connected входящего плеча (входящий звонок)');
  
  // Ответили ли на входящий звонок
  store.callInData.successful = true;
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

// Финальный метод сессии, тут в основном идут отправки данных в СРМ и прочие завершающиеся вычисления
const finalActions = async () => {
  // Один из простых вариантов НЕ выполнять данный метод дважды или более раз, если вызов функции идет в 2-х или более разных мест, с асинхронным выполнением
  if (store.beenInFinalActions) return;
  store.beenInFinalActions = true;
  
  Logger.write('[LOGGER] Попали в finalActions');
  
  // Записываем время длительности сессии
  metric.duration_session = store.duration.session.endTime().duration();
  // Записываем время длительности разговора
  store.callInData.duration = store.callOutData.duration = metric.duration_talk = store.duration.talk.endTime().duration();
  // Записываем данные входящего и исходящего звонка
  metric.calls_data.push(store.callInData, store.callOutData);
  
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

const outConnected = async ({sipCallId}) => {
  Logger.write('[LOGGER] Попали в connected исходящего плеча (исходящий звонок)');
  
  // Записали идентификатор звонка входящего плеча
  store.callOutData.call_id = sipCallId;
  // Ответили ли на входящий звонок
  store.callOutData.successful = true;
  
  // Вписываем код 200 - т.к. успешно соединились с исходящим плечом
  metric.call_status_code = 200;
  // Проставляем статус успешного коннекта
  metric.call_status = statuses.call_status.connected;
  // Записываем время за которое дозвонились до исходящего плеча
  metric.duration_dialing = store.duration.dialing.endTime().duration();
  
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

const outFailed = async ({code, sipCallId}) => {
  Logger.write('[LOGGER] Попали в failed исходящего плеча (исходящий звонок)');
  // Записали идентификатор звонка входящего плеча
  store.callOutData.call_id = sipCallId;
  
  // Записываем код фейла звонка, забираем из результирующего объекта фейла
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
    metric.duration_session_before_call = store.duration.session_before_call.endTime().duration();
    store.duration.dialing.startTime();
    
    // Если у нас входящий вызов пришел по PSTN - исходящий будет USER или SIP. Если нужно звонить на PSTN дополнительно нужно указывать номер для исходящего звонка. Все зависит от вашей реализации, это лишь пример.
    if (store.callInData.remote_number_type === 'pstn') {
      Logger.write(`[LOGGER] Исходящий звонок совершаем пользователю: ${store.username}`);
      metric.phone_b = store.username;
      metric.destination_b = metric.destination_a;
      // Тип звонка (зависит от типа исходящего звонка (pstn, sip, user - VoxEngine.callPSTN, VoxEngine.callSIP, VoxEngine.callUser)
      store.callOutData.remote_number_type = 'user';
      
      store.callOut = VoxEngine.callUser({
        username: store.username,
        callerid: metric.destination_b,
      });
    } else {
      Logger.write(`[LOGGER] Исходящий звонок совершаем через PSTN: ${store.aon} >>> ${phone}`);
      metric.phone_b = phone;
      metric.destination_b = store.aon;
      // Тип звонка (зависит от типа исходящего звонка (pstn, sip, user - VoxEngine.callPSTN, VoxEngine.callSIP, VoxEngine.callUser)
      store.callOutData.remote_number_type = 'pstn';
      
      store.callOut = VoxEngine.callPSTN(phone, store.aon);
    }
    
    // Входящее ли плечо? - Нет
    store.callOutData.incoming = false;
    // Ответили ли на исходящий звонок (в событии connect проставляем true)
    store.callOutData.successful = false;
    // Время старта исходящего звонка (по UTC 0)
    store.callOutData.start_time = Utils.getCallDateTime({utc: 0});
    // Кто звонит
    store.callOutData.caller_id = metric.phone_b;
    // На какой номер звонит
    store.callOutData.destination = metric.destination_b;
    
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

// Событие старта сценария (сработает раньше, чем событие входящего звонка!!!)
VoxEngine.addEventListener(AppEvents.Started, async (callData) => {
  // Идентификатор сессии
  metric.session_id = callData.sessionId;
  // Время старта сессии (по UTC 0)
  metric.session_date_time = Utils.getCallDateTime({utc: 0});
  // Лог сессии
  metric.log_url = callData.logURL;
  
  store.duration.session.startTime();
  store.duration.session_before_call.startTime();
  
  // Если кастом дата не пришла - входящий
  if (!VoxEngine.customData()) return;
  
  // Кастом дата звонка
  metric.custom_data = JSON.parse(VoxEngine.customData());
  
  // Присваиваем значения из customData в такие же поля в metric
  Object.assign(metric, Utils.mapProps(metric.custom_data, metric));
  
  // Запускаем исходящий звонок
  Utils.callOut(metric.phone_b);
});

// Событие входящего вызова
VoxEngine.addEventListener(AppEvents.CallAlerting, (callData) => {
  // Объект текущего звонка
  store.callIn = callData.call;
  // Записали идентификатор звонка входящего плеча
  store.callInData.call_id = callData['id'] ?? callData['sipCallId'];
  // Входящее ли плечо? - Да
  store.callInData.incoming = true;
  // Ответили ли на входящий звонок (в событии connect проставляем true)
  store.callInData.successful = false;
  // Время старта входящего звонка (по UTC 0)
  store.callInData.start_time = Utils.getCallDateTime({utc: 0});
  // Кто звонит
  store.callInData.caller_id = callData.callerid;
  // На какой номер звонит
  store.callInData.destination = callData.destination;
  // Тип звонка
  store.callInData.remote_number_type = callData.headers['VI-Client-Type'];
  
  // Кто звонит
  metric.phone_a = callData.callerid;
  // На какой номер звонит
  metric.destination_a = callData.destination;
  
  // Проигрываем гудки до момента поднятия трубки исходящего плеча
  store.callIn.startEarlyMedia();
  store.callIn.playProgressTone('RU');
  
  // Инициализируем события коннекта и дисконнекта входящего плеча и поднимаем трубку
  store.callIn.addEventListener(CallEvents.Connected, inConnected);
  store.callIn.addEventListener(CallEvents.Disconnected, inDisconnected);
  store.callIn.answer();
  
  // Запускаем исходящий звонок
  Utils.callOut(callData.destination);
});
