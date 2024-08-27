import {store} from '../globals/store';
import {Metric} from './metric';
import {metric} from '../globals/metric';

export const finalActions = async () => {
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
