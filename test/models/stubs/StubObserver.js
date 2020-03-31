import _ from 'underscore';

/**
 * @property {EventEmitter} observer
 * */
export default class StubObserver {
    constructor (observer) {
        this.observer = observer;
    }

    async waitEvent (evnts, timeout = Number.MAX_SAFE_INTEGER) {
        if (_.isNumber (evnts)) {
            timeout = evnts;
            evnts = undefined;
        }
        if (_.isString (evnts))
            evnts = [evnts];
        timeout = timeout || Number.MAX_SAFE_INTEGER;
        let timeoutHandler = null;
        let listeners = {};
        //timeout = timeout * 100;
        try {
            return await new Promise ((resolve, reject) => {
                timeoutHandler = setTimeout (() => {
                    reject (new Error (`Timeout: ${timeout} ${evnts ? evnts.join (',') : ''}`));
                }, timeout);
                _.each (['added', 'changed', 'removed'], (entName) => {
                    if (!evnts || evnts.indexOf (entName) > -1) {
                        let listener = function () {
                            resolve (_.toArray (arguments));
                        };
                        listeners[entName] = listener;
                        this.observer.once (entName, listener);
                    }
                });
            });
        }catch (e) {
            throw e;
        } finally {
            clearTimeout (timeoutHandler);
            _.each (listeners, (listener, evntName) => {
                this.observer.removeListener (evntName, listener);
            })
        }
    }

    async waitRefresh (timeout = Number.MAX_SAFE_INTEGER) {
        timeout = timeout || Number.MAX_SAFE_INTEGER;
        let timeoutHandler = null;
        let listener = null;
        //timeout = timeout * 100;
        try {
            return await new Promise ((resolve, reject) => {
                timeoutHandler = setTimeout (() => {
                    reject (new Error (`Timeout: ${timeout}`));
                }, timeout);
                listener = (delay) => {
                    resolve (delay);
                };
                this.observer.once ('refresh', listener);
            });
        } finally {
            clearTimeout (timeoutHandler);
            this.observer.removeListener ('refresh', listener);
        }
    }
}