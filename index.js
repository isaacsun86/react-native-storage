'use strict';
import { AsyncStorage } from 'react-native';
import _ from 'lodash';
let stringify = function (value) {
  if (_.isString(value)) {
    return value;
  } else {
    return JSON.stringify(value);
  }
};
let parse = function (value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}
function LocalStorage(modelName) {
  let MODEL_KEYS = 'keys:' + modelName;
  let MODEL_NAME_SUFFIX = '@' + modelName;
  return {
    setObject: async function (value) {
      try {
        let valueString = JSON.stringify(value);
        if (valueString) {
          await AsyncStorage.setItem(modelName, valueString);
        }
      } catch (e) {
        return 'Set object error';
      }
    },
    getObject: async function () {
      try {
        let rlt = await AsyncStorage.getItem(modelName);
        return JSON.parse(rlt);
      } catch (e) {
        return;
      }
    },
    merge: async function (value) {
      if (!value) {
        return;
      }
      try {
        let rlt = await AsyncStorage.mergeItem(modelName, JSON.stringify(value));
        return;
      } catch (e) {
        return 'Merge item error';
      }
    },
    getStringItem: async function (key) {
      try {
        let rlt = await AsyncStorage.getItem(modelName + "@" + key);
        return rlt;
      } catch (e) {
        return '';
      }
    },
    getObjectItem: async function (key) {
      try {
        let rlt = await AsyncStorage.getItem(modelName + "@" + key);
        return JSON.parse(rlt);
      } catch (e) {
        return;
      }
    },
    setStringItem: async function (key, value) {
      try {
        value += "";
        await AsyncStorage.setItem(modelName + "@" + key, value);
        return;
      } catch (e) {
        return 'Set string error';
      }
    },
    setObjectItem: async function (key, value) {
      try {
        let valueString = JSON.stringify(value);
        if (valueString) {
          await AsyncStorage.setItem(modelName + "@" + key, valueString);
        }
        return;
      } catch (e) {
        return 'Set object error';
      }
    },
    removeItem: async function (key) {
      try {
        let rlt = await AsyncStorage.removeItem(modelName + "@" + key);
        return;
      } catch (e) {
        return 'Remove item error';
      }
    },
    mergeItem: async function (key, value) {
      if (!value) {
        return;
      }
      try {
        let rlt = await AsyncStorage.mergeItem(modelName + "@" + key, JSON.stringify(value));
        return;
      } catch (e) {
        return 'Merge item error';
      }
    },
    set: async (value) => {
      if (_.isArray(value) || _.isPlainObject(value)) {
        try {
          let ps = [];
          let keys = [];
          _.forEach(value, (v, k) => {
            keys.push(k);
            ps.push(AsyncStorage.setItem(k + MODEL_NAME_SUFFIX, stringify(v)));
          });
          await Promise.all(ps);
          await AsyncStorage.setItem(MODEL_KEYS, stringify({ keys, type: _.isPlainObject(value) ? 'object' : 'array' }));
          return true;
        } catch (e) {
          console.log('AsyncStorage set failed.Error:', e)
          return false;
        }
      } else {
        return false;
      }
    },
    setByKey: async (key, value) => {
      try {
        let keys = await AsyncStorage.getItem(MODEL_KEYS);
        keys = JSON.parse(keys);
        if(!keys){
          return false;
        }
        if (!_.includes(keys.keys, key)) {
          keys.keys.push(key);
          await AsyncStorage.setItem(MODEL_KEYS, stringify(keys));
        }
        await AsyncStorage.setItem(key + MODEL_NAME_SUFFIX, stringify(value));
        return true;
      } catch (e) {
        console.log('AsyncStorage setByKey failed.Error:', e)
        return false;
      }
    },
    get: async () => {
      try {
        let keys = await AsyncStorage.getItem(MODEL_KEYS);
        if(!keys){
          return null;
        }
        keys = parse(keys) || { keys: [], type: 'object' };
        let ps = keys.keys.map((k) => {
          return AsyncStorage.getItem(k + MODEL_NAME_SUFFIX);
        })
        let values = await Promise.all(ps) || [];
        let rlt = keys.type == 'object' ? {} : [];
        values.forEach((v, i) => {
          if (keys.type == 'object') {
            rlt[keys.keys[i]] = parse(v);
          } else {
            rlt.push(parse(v));
          }
        });
        return rlt;
      } catch (e) {
        console.log('AsyncStorage get failed.Error:', e)
        return null;
      }
    },
    //Object only.
    getByKey: async (key) => {
      try {
        let rlt = await AsyncStorage.getItem(key + MODEL_NAME_SUFFIX);
        return parse(rlt);
      } catch (e) {
        console.log('AsyncStorage getByKey failed.Error:', e)
        return null;
      }
    },
    /**
     * This method is just for Array storage.Return an array object select form begin to end(not include end).
     */
    arraySlice: async (begin, end) => {
      try {
        let keyStore = await AsyncStorage.getItem(MODEL_KEYS);
        keyStore = JSON.parse(keyStore);
        if (!keyStore || keyStore.type != 'array') {
          return [];
        }
        let keys = keyStore.keys.slice(begin, end);
        let ps = keys.map((v) => {
          return AsyncStorage.get(v + MODEL_NAME_SUFFIX);
        });
        let rlt = await Promise.all(ps);
        return rlt.map((v) => {
          return parse(v);
        })
      } catch (e) {
        console.log('AsyncStorage arraySlice failed.Error:', e)
        return [];
      }
    },
    /**
     * This method adds one value to the array storage.
     * Return true if success or false if failed.
     */
    arrayPush: async (value) => {
      try {
        //It will return null if there's no value for the key.
        let keys = await AsyncStorage.getItem(MODEL_KEYS);
        keys = JSON.parse(keys);
        if (!keys || keys.type != 'array') {
          return false;
        }
        let key = _.last(keys.keys) + 1;
        keys.keys.push(key);
        await Promise.all(
          [AsyncStorage.setItem(MODEL_KEYS, stringify(keys)),
          AsyncStorage.setItem(key + MODEL_NAME_SUFFIX, stringify(value))]);
        return true;
      } catch (e) {
        console.log('AsyncStorage arrayPush failed.Error:', e)
        return false;
      }
    },
    arrayLength:async()=>{
      try {
        let keyStore = await AsyncStorage.getItem(MODEL_KEYS);
        keyStore = JSON.parse(keyStore);
        if (!keyStore || keyStore.type != 'array') {
          return 0;
        }else{
          return keyStore.keys.length;
        }
      } catch (e) {
        console.log('AsyncStorage arrayLength failed.Error:', e)
        return 0;
      }
    },
    //Todo
    clearSelf:async()=>{
      return false;
    },
    clearAllStorage: async function () {
      try {
        let rlt = await AsyncStorage.clear();
        return;
      } catch (e) {
        return 'clear-all error';
      }
    },
  }
}
export {
LocalStorage
}
