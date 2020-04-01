import ObserveCursor from "./ObserveCursor";
import EventEmitter from 'events';
import {modelPopulate} from '../src/mongooseUtils';
import _ from 'underscore';
import populateProxy from '../src/PopulateProxy';

function queryEquals (query1, query2) {
    if (!query1 && !query2)
        return true;
    if (!query1 || !query2)
        return false;
    if (query1.op !== query2.op)
        return false;
    let serializedCondition1 = JSON.stringify (query1._conditions);
    let serializedCondition2 = JSON.stringify (query2._conditions);
    if (serializedCondition1 !== serializedCondition2)
        return false;

    let serializedOptions1 = JSON.stringify (query1.options);
    let serializedOptions2 = JSON.stringify (query2.options);
    if (serializedOptions1 !== serializedOptions2)
        return false;
    return true;
}

export default class ObserveCursorDeep extends EventEmitter {
    constructor (query, options) {
        super ();
        this.options = options;
        this.rootQuery = query;
        this.setMaxListeners (0);
        this.rootObserver = new ObserveCursor (query, options);
        this.popData = {};
    }

    /**@param {object} handlers
     * @param {function(id:String, doc:mongoose.Document)} handlers.added
     * @param {function(id:string, changedFields:object,newDoc:mongoose.Document,oldDoc: mongoose.Document)} handlers.changed
     * @param {function(id:String, removedDoc:mongoose.Document)} handlers.removed
     **/
    observeChanges (handlers) {
        let handlersWrapper = {};
        const self = this;
        let counters = {
            added:0,
            changed:0,
            removed:0
        }
        if (handlers.added) {
            // eslint-disable-next-line no-unused-vars
            handlersWrapper.added = function (id, doc) {
                counters.added++;
                handlers.added.apply (self, arguments);
            }
        }
        if (handlers.changed) {
            // eslint-disable-next-line no-unused-vars
            handlersWrapper.changed = function (id, changedFields, newDoc, oldDoc) {
                counters.changed++;
                handlers.changed.apply (self, arguments);
            }
        }
        if (handlers.removed) {
            // eslint-disable-next-line no-unused-vars
            handlersWrapper.removed = function (id, removedDoc) {
                counters.removed++;
                handlers.removed.apply (self, arguments);
            }
        }

        let wasRefreshed = false;
        this.rootObserver.on ('refresh', async (delay) => {
            let started = Date.now ();
            let populatedPaths = this.rootQuery.getPopulatedPaths ();

            let models = _.chain (this.currentModels ())
            .map ((model) => {
                return populateProxy (model, {populatedPaths, set: true})
            })
            .value ();

            if (
                handlers.changed &&
                !_.isEmpty (models) && !_.isEmpty (populatedPaths)
                &&(!wasRefreshed||counters.added>0||counters.changed>0||counters.removed>0)
            ) {
                counters.added=0;
                counters.changed=0;
                counters.removed=0;
                this.rootObserver.pause ();
                /**@type Array<QueryItem>*/
                let newQueries = await modelPopulate.apply (this.rootQuery.model, [models, populatedPaths]);
                const queryItemChanged = (oldItem, newItem) => {
                    if (oldItem)
                        oldItem.observer.stop ();
                    queryItemAdded (newItem);
                };
                const queryItemAdded = async (newItem) => {
                    newItem.observer = new ObserveCursor (newItem.query, this.options);
                    let populateLoaded = false;
                    let refreshScheduled = 0;

                    // eslint-disable-next-line no-inner-declarations
                    function doRefresh () {
                        newItem.assign (newItem.observer.currentModels (false));
                        _.each (models, (model) => {
                            let changedPathes = model.__changedPathes;
                            if (!_.isEmpty (changedPathes)) {
                                if (handlers.changed) {
                                    handlers.changed.apply (self, [model.id, changedPathes, model, model]);
                                    self.emit ('changed', model.id, changedPathes, model, model);
                                    model.__clearChangedPathes ();
                                }
                            }
                        });
                    }

                    let scheduleRefresh = function () {
                        if (!refreshScheduled) {
                            refreshScheduled = true;
                            newItem.observer.once ('refresh', () => {
                                doRefresh ();
                                refreshScheduled = false;
                            });
                        }
                    };

                    newItem.observer.observeChanges ({
                        // eslint-disable-next-line no-unused-vars
                        added (id, doc) {
                            if (populateLoaded) {
                                scheduleRefresh ();
                            }
                        },
                        // eslint-disable-next-line no-unused-vars
                        changed (id, changedFields, newDoc, oldDoc) {
                            scheduleRefresh ();
                        },
                        // eslint-disable-next-line no-unused-vars
                        removed (id, removedDoc) {
                            scheduleRefresh ();
                        }
                    });
                    await newItem.observer.models (false);
                    doRefresh ();
                    populateLoaded = true;
                    return newItem;
                };


                let oldPopPaths = _.keys (this.popData);

                _.each (oldPopPaths, async (popName) => {
                    let oldItems = this.popData[popName];
                    let newItems = newQueries[popName];
                    if (!newItems || _.size (newItems) !== _.size (oldItems)) {
                        _.each (oldItems, (oldItem) => {
                            oldItem.observer.stop ();
                        });
                        return delete this.popData[popName];
                    }
                    _.each (oldItems, (oldQueryItem, index) => {
                        let newQueryItem = newItems[index];
                        if (queryEquals (oldQueryItem.observer.query, newQueryItem.query)) {

                        } else {//изменилось
                            queryItemChanged (oldQueryItem, newQueryItem);
                        }
                    });
                });

                await Promise.all (
                    _.map (newQueries, async (newItems, popName) => {
                        if (!this.popData[popName]) {
                            this.popData[popName] = [];
                            for (let i = 0; i < newItems.length; i++) {
                                let newItem = newItems[i];
                                await queryItemAdded (newItem);
                                this.popData[popName].push (newItem);
                            }
                        }
                    }));

                this.rootObserver.awake ();

            }
            let spended = Date.now () - started;
            wasRefreshed = true;
            this.emit ('refresh', delay + spended);
        });
        this.rootObserver.observeChanges (handlersWrapper);
        return this;
    }

    currentModels (raw = false) {
        return _.chain (this.rootObserver.modelsMap)
        .values ()
        .map ((model) => {
            if (raw) {
                return model.toObject ({getters: false});
            }
            return model;
        })
        .value ()
    }

    models (raw) {
        return this.rootObserver.models (raw);
    }

    stop () {
        this.rootObserver.stop ();
    }
}