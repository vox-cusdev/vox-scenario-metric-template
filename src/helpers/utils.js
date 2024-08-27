import {outConnected, outDisconnected, outFailed} from '../handlers';
import {store} from '../globals/store';
import {metric} from '../globals/metric';

export class Utils {
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
