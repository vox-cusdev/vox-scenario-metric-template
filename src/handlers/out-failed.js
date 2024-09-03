import {finalActions} from '../helpers/final-actions';
import {metric, statuses} from '../globals/metric';
import {store} from '../globals/store';

export const outFailed = async ({code, sipCallId}) => {
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
