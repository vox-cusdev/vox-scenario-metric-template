import {store} from '../globals/store';
import {Metric} from './metric';
import {metric} from '../globals/metric';

// Финальный метод сессии, тут в основном идут отправки данных в СРМ и прочие завершающиеся вычисления
export const finalActions = async () => {
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
