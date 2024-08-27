import {inConnected, inDisconnected} from './handlers';
import {metric} from './globals/metric';
import {Utils} from './helpers/utils';
import {store} from './globals/store';

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
