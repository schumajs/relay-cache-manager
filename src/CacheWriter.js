/**
 *  Implements the CacheWriter interface specified by
 *  RelayTypes, uses an instance of CacheRecordStore
 *  to manage the CacheRecord instances
 *  @flow
 */

import CacheRecordStore from './CacheRecordStore';
import type { CacheRecord } from './CacheRecordStore';

const DEFAULT_STORAGE: any = localStorage;

const DEFAULT_STORAGE_KEY: string = '__RelayCacheManager__';

function defaultStorageGet() : CacheRecordStore {
  return DEFAULT_STORAGE.getItem(DEFAULT_STORAGE_KEY)
}

function defaultStorageSet(json: string) {
  DEFAULT_STORAGE.setItem(DEFAULT_STORAGE_KEY, json);
}

function defaultStorageRem() {
  DEFAULT_STORAGE.removeItem(DEFAULT_STORAGE_KEY);
}

type CacheWriterOptions = {
  defaultStorageGet: () => string,
  defaultStorageSet: (json: string) => {},
  defaultStorageRem: () => {} 
}

export default class CacheWriter {
  recordStore: CacheRecordStore;

  defaultStorageGet: () => string;

  defaultStorageSet: (json: string) => {};

  defaultStorageRem: () => {};
  
  constructor(options: CacheWriterOptions = {}) {
    this.defaultStorageGet = options.defaultStorageGet || defaultStorageGet
    this.defaultStorageSet = options.defaultStorageSet || defaultStorageSet
    this.defaultStorageRem = options.defaultStorageRem || defaultStorageRem

    try {
      this.recordStore = CacheRecordStore.fromJSON(this.defaultStorageGet());

      if (!this.recordStore) {
        this.recordStore = new CacheRecordStore();
      }
    } catch(err) {
      this.recordStore = new CacheRecordStore();
    }
  }

  clearStorage() {
    try {
      this.defaultStorageRem();
    } catch (err) {
      /* noop */
    }

    this.recordStore = new CacheRecordStore();
  }

  writeField(
    dataId: string,
    field: string,
    value: ?mixed,
    typeName: ?string
  ) {
    let record = this.recordStore.records[dataId];
    if (!record) {
      record = {
        __dataID__: dataId,
        __typename: typeName,
      }
    }
    record[field] = value;
    this.recordStore.records[dataId] = record;
    try {
      this.defaultStorageSet(JSON.stringify(this.recordStore));
    } catch (err) {
      /* noop */
    }
  }

  writeNode(dataId: string, record: CacheRecord) {
    this.recordStore.writeRecord(dataId, record);
  }

  readNode(dataId: string) {
    return this.recordStore.readNode(dataId)
  }

  writeRootCall(
    storageKey: string,
    identifyingArgValue: string,
    dataId: string
  ) {
    this.recordStore.rootCallMap[storageKey] = dataId;
  }

  readRootCall(
    callName: string,
    callValue: string,
    callback: (error: any, value: any) => void
  ) {
    const dataId = this.recordStore.rootCallMap[callName];
    setImmediate(callback.bind(null, null, dataId));
  }

}
