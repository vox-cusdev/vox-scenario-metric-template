import {store} from '../globals/store';

export const inConnected = async () => {
  Logger.write('[LOGGER] Попали в connected входящего плеча (входящий звонок)');
  
  // Ответили ли на входящий звонок
  store.callInData.successful = true;
};
