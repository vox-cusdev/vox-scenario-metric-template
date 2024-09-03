import {outConnected, outDisconnected, outFailed} from '../handlers';
import {store} from '../globals/store';
import {metric} from '../globals/metric';

export class Utils {
  static callOut(phone) {
    metric.duration_session_before_call = store.duration.session_before_call.endTime().duration();
    store.duration.dialing.startTime();
    
    // Если у нас входящий вызов пришел по PSTN - исходящий будет USER или SIP. Если нужно звонить на PSTN дополнительно нужно указывать номер для исходящего звонка. Все зависит от вашей реализации, это лишь пример.
    if (store.callInData.remote_number_type === 'pstn') {
      Logger.write(`[LOGGER] Исходящий звонок совершаем пользователю: ${store.username}`);
      metric.phone_b = store.username;
      metric.destination_b = metric.destination_a
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
