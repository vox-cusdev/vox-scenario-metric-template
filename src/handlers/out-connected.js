import {store} from '../globals/store';
import {metric, statuses} from '../globals/metric';

export const outConnected = async () => {
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
