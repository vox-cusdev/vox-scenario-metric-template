import {inConnected, inDisconnected} from './handlers';
import {metric} from './globals/metric';
import {Utils} from './helpers/utils';
import {store} from './globals/store';

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
